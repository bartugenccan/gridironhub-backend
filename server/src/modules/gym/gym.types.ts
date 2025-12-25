export interface GymCheckin {
  id: string;
  userId: string;
  teamId: string;
  checkinDate: string; // YYYY-MM-DD
  createdAt: string;
  playerName?: string;
}

export interface CreateCheckinDTO {
  checkinDate: string; // YYYY-MM-DD
}

export interface CheckinResponse {
  checkin: GymCheckin;
  message: string;
}

export interface CheckinHistoryResponse {
  checkins: GymCheckin[];
}
