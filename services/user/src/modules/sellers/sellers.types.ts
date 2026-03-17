export interface SellerStatusResponse {
  sellerStatus: 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED';
}

export interface SellerRequest {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  sellerStatus: string;
  createdAt: Date;
}
