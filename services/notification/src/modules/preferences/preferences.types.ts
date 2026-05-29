export interface PreferenceResponse {
  userId: string;
  emailEnabled: boolean;
  smsEnabled: boolean;
  pushEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdatePreferenceInput {
  emailEnabled?: boolean;
  smsEnabled?: boolean;
  pushEnabled?: boolean;
}
