// Course System Types
export interface QuizQuestion {
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

export interface QuizContent {
  questions: QuizQuestion[];
}

export interface TextContent {
  text: string;
}

export interface PlaygroundChallenge {
  title: string;
  badPrompt?: string;
  hints?: string[];
  exampleGoodPrompt?: string;
  task?: string;
  hint?: string;
}

export interface PlaygroundContent {
  description: string;
  challenges: PlaygroundChallenge[];
}

export interface ChallengeExercise {
  title?: string;
  task: string;
  requirements?: string[];
  original?: string;
  context?: string;
}

export interface ChallengeContent {
  description: string;
  challenges?: ChallengeExercise[];
  exercises?: ChallengeExercise[];
  scenarios?: ChallengeExercise[];
  codeToRefactor?: string;
  functionToTest?: string;
  userStory?: string;
  expectedOutput?: string[];
  goals?: string[];
  challenge?: {
    title: string;
    requirements: string;
    evaluation: string[];
  };
  tips?: string[];
}

export type LessonContent = TextContent | QuizContent | PlaygroundContent | ChallengeContent;

export interface Lesson {
  id: string;
  title: string;
  type: 'video' | 'text' | 'quiz' | 'challenge' | 'playground';
  content: LessonContent;
}

export interface Module {
  id: string;
  title: string;
  description: string;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  title: string;
  description: string;
  author: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedHours: number;
  tags: string[];
  modules: Module[];
}

// User Progress Types
export interface LessonProgress {
  lessonId: string;
  completed: boolean;
  score?: number;
  completedAt?: string;
  attempts?: number;
}

export interface ModuleProgress {
  moduleId: string;
  lessonsProgress: Record<string, LessonProgress>;
  completedAt?: string;
}

export interface CourseProgress {
  courseId: string;
  enrolledAt: string;
  modulesProgress: Record<string, ModuleProgress>;
  overallProgress: number; // 0-100
  completedAt?: string;
  certificateId?: string;
}

export interface UserCourseData {
  courses: Record<string, CourseProgress>;
  achievements: string[];
  followers: string[];
  following: string[];
  publicContext?: string;
  totalPoints: number;
  rank?: number;
}

export interface LeaderboardEntry {
  username: string;
  totalPoints: number;
  coursesCompleted: number;
  achievements: string[];
  rank: number;
}
