export const Tracks = [
    "Application",
    "Ecosystem",
    "Education",
    "Research",
    "Regulation",
    "Workshop",
    "TBC'25",
    "Academic Forum",
  ] as const;
  
export const Stages = [
    "Stage 1",
    "Stage 2",
    "Stage 3",
    "Workshop Room",
    "Gern",
    "Lab Lounge",
] as const;
  
export const StageMap: Record<(typeof Stages)[number], string> = { 
    "Stage 1": "Turing Stage",
    "Stage 2": "Hopper Stage",
    "Stage 3": "Nakamoto Stage",
    "Workshop Room": "Lovelace Room",
    "Gern": "Gern",
    "Lab Lounge": "Lab Lounge",
} as const;

export interface Session {
    id: number;
    documentId: string;
    title: string;
    track?: (typeof Tracks)[number] | null;
    type?: "Workshop" | "Panel Discussion" | "Talk" | null;
    startTime: string;
    endTime: string;
    room: (typeof StageMap)[keyof typeof StageMap];
    description?: string | null;
    speakers?: Record<string, string> | null;
    isSpecialSession?: boolean | null;
    registrationLink?: string | null;
    createdAt: string;
    updatedAt: string;
    publishedAt: string;
}