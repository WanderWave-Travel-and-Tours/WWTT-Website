// Revenue = money actually received. Booking payments are recorded by the
// PayMongo webhook (initialPaymentPaid / balancePaidAmount); an admin "Confirm"
// only flips status, so status === 'confirmed' does not mean paid.
export const bookingPayments = (b) => {
  const out = [];
  if (b.initialPaymentPaid) {
    out.push({ amount: b.initialPaymentAmount || 0, date: new Date(b.initialPaymentPaidAt || b.paidAt || b.updatedAt) });
  }
  if (b.balancePaidAmount > 0) {
    out.push({ amount: b.balancePaidAmount, date: new Date(b.balancePaymentPaidAt || b.balancePaidAt || b.paidAt || b.updatedAt) });
  }
  return out;
};

// Services count once an admin has confirmed the payment. 'PAID' is excluded:
// customers set it themselves via /api/inquiries/:id/pay before verification.
const PAID_INQUIRY_STATUSES = ['CONFIRMED', 'PROCESSING', 'READY', 'COMPLETED'];

export const inquiryPayments = (i) =>
  PAID_INQUIRY_STATUSES.includes(i.status)
    ? [{ amount: i.estimatedPrice || 0, date: new Date(i.paymentConfirmedAt || i.updatedAt) }]
    : [];

export const sumPaid = (items, toPayments, start = new Date(0), end = new Date(8.64e15)) =>
  (items || []).reduce(
    (sum, item) => sum + toPayments(item).reduce((s, p) => (p.date >= start && p.date <= end ? s + p.amount : s), 0),
    0
  );

export const bookingsPaid = (bookings, start, end) => sumPaid(bookings, bookingPayments, start, end);
export const inquiriesPaid = (inquiries, start, end) => sumPaid(inquiries, inquiryPayments, start, end);
