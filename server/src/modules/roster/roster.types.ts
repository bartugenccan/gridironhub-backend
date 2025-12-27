export interface RosterMember {
  id: string;
  fullName: string;
  role: 'coach' | 'player';
}

export interface PlayerRosterMember extends RosterMember {
  role: 'player';
  jerseyNumber: number | null;
  position: string[] | null;
}

export interface CoachRosterMember extends RosterMember {
  role: 'coach';
  primaryPosition: string[] | null;
}

export interface RosterResponse {
  teamId: string;
  coaches: CoachRosterMember[];
  players: PlayerRosterMember[];
}
