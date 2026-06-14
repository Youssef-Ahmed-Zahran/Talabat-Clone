export interface Review {
  id: string;
  storeId: string;
  userId: string;
  orderId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  user: {
    id: string;
    fullName: string;
  };
}

export interface ReviewSummary {
  averageRating: number;
  totalReviews: number;
}

export interface StoreReviewsResponse {
  reviews: Review[];
  summary: ReviewSummary;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
