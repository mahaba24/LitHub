/** One follow relationship, stored at follows/{followerId}_{followeeId}. */
export type Follow = {
  id: string;
  followerId: string;
  followerName: string;
  followeeId: string;
  followeeName: string;
  createdAt: number;
};
