import React from 'react';
import { Star } from 'lucide-react';

const StarRating = ({ rating, size = 16, color = '#fbbf24' }) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    // Full stars
    for (let i = 0; i < fullStars; i++) {
        stars.push(
            <Star key={`full-${i}`} size={size} fill={color} color={color} />
        );
    }

    // Half star
    if (hasHalfStar) {
        stars.push(
            <div key="half" style={{ position: 'relative', display: 'inline-block' }}>
                <Star size={size} color="#e5e7eb" fill="#e5e7eb" />
                <div style={{ 
                    position: 'absolute', 
                    top: 0, 
                    left: 0, 
                    width: '50%', 
                    overflow: 'hidden' 
                }}>
                    <Star size={size} fill={color} color={color} />
                </div>
            </div>
        );
    }

    // Empty stars
    for (let i = 0; i < emptyStars; i++) {
        stars.push(
            <Star key={`empty-${i}`} size={size} color="#e5e7eb" fill="#e5e7eb" />
        );
    }

    return <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>{stars}</div>;
};

export default StarRating;