// Poll data shape in DB
export interface Poll {
  id: number;
  question: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
  poll_options: PollOption[];
}

export interface PollOption {
  id: string;
  text: string;
  votes?: { count: number };
}

// Used when returning active poll with votes
export interface PollOptionWithVotes {
  id: string;
  text: string;
  votes?: number; // ✅ array of objects
}

export interface PollResponse {
  poll: { id: string; question: string };
  options: PollOptionWithVotes[];
}

// Used to submit a new poll
export interface PollSubmission {
  question: string;
  options: string[];
}

// Used when inserting a vote
export interface Vote {
  id: string;
  poll_id: string;
  user_id: string;
  selected_option: string;
  created_at: string;
  updated_at?: string;
}

export interface PollApiResponse {
  poll: Poll[];
}
