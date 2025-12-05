import { promises as fs } from 'fs';
import path from 'path';
import { Course, CourseProgress, UserCourseData, LeaderboardEntry } from './course-types';
import { Redis } from '@upstash/redis';

// Course Data Access
export async function getAllCourses(): Promise<Course[]> {
  const coursesDir = path.join(process.cwd(), 'data', 'courses');
  
  try {
    const files = await fs.readdir(coursesDir);
    const jsonFiles = files.filter(f => f.endsWith('.json'));
    
    const courses = await Promise.all(
      jsonFiles.map(async (file) => {
        const content = await fs.readFile(path.join(coursesDir, file), 'utf-8');
        return JSON.parse(content) as Course;
      })
    );
    
    return courses;
  } catch (error) {
    console.error('Error loading courses:', error);
    return [];
  }
}

export async function getCourseById(courseId: string): Promise<Course | null> {
  const courses = await getAllCourses();
  return courses.find(c => c.id === courseId) || null;
}

// User Progress Access (Redis)
export async function getUserCourseData(username: string): Promise<UserCourseData | null> {
  try {
    const redis = Redis.fromEnv();
    const data = await redis.get<UserCourseData>(`courseData:${username}`);
    return data;
  } catch (error) {
    console.error('Error getting user course data:', error);
    return null;
  }
}

export async function updateUserCourseData(username: string, data: UserCourseData): Promise<boolean> {
  try {
    const redis = Redis.fromEnv();
    await redis.set(`courseData:${username}`, data);
    return true;
  } catch (error) {
    console.error('Error updating user course data:', error);
    return false;
  }
}

export async function initializeUserCourseData(username: string): Promise<UserCourseData> {
  const initialData: UserCourseData = {
    courses: {},
    achievements: [],
    followers: [],
    following: [],
    totalPoints: 0
  };
  
  await updateUserCourseData(username, initialData);
  return initialData;
}

export async function enrollInCourse(username: string, courseId: string): Promise<CourseProgress> {
  let userData = await getUserCourseData(username);
  
  if (!userData) {
    userData = await initializeUserCourseData(username);
  }
  
  if (userData.courses[courseId]) {
    return userData.courses[courseId];
  }
  
  const progress: CourseProgress = {
    courseId,
    enrolledAt: new Date().toISOString(),
    modulesProgress: {},
    overallProgress: 0
  };
  
  userData.courses[courseId] = progress;
  await updateUserCourseData(username, userData);
  
  return progress;
}

export async function updateLessonProgress(
  username: string,
  courseId: string,
  moduleId: string,
  lessonId: string,
  completed: boolean,
  score?: number
): Promise<boolean> {
  let userData = await getUserCourseData(username);
  
  if (!userData || !userData.courses[courseId]) {
    return false;
  }
  
  const courseProgress = userData.courses[courseId];
  
  if (!courseProgress.modulesProgress[moduleId]) {
    courseProgress.modulesProgress[moduleId] = {
      moduleId,
      lessonsProgress: {}
    };
  }
  
  const moduleProgress = courseProgress.modulesProgress[moduleId];
  const previouslyCompleted = moduleProgress.lessonsProgress[lessonId]?.completed || false;
  
  moduleProgress.lessonsProgress[lessonId] = {
    lessonId,
    completed,
    score,
    completedAt: completed ? new Date().toISOString() : undefined,
    attempts: (moduleProgress.lessonsProgress[lessonId]?.attempts || 0) + 1
  };
  
  // Award points for first completion
  if (completed && !previouslyCompleted) {
    userData.totalPoints += score ? score * 10 : 10;
  }
  
  // Recalculate overall progress
  const course = await getCourseById(courseId);
  if (course) {
    const totalLessons = course.modules.reduce((sum, m) => sum + m.lessons.length, 0);
    let completedLessons = 0;
    
    for (const mod of Object.values(courseProgress.modulesProgress)) {
      for (const lesson of Object.values(mod.lessonsProgress)) {
        if (lesson.completed) completedLessons++;
      }
    }
    
    courseProgress.overallProgress = Math.round((completedLessons / totalLessons) * 100);
    
    // Check if course is completed
    if (courseProgress.overallProgress === 100 && !courseProgress.completedAt) {
      courseProgress.completedAt = new Date().toISOString();
      courseProgress.certificateId = `CERT-${courseId}-${username}-${Date.now()}`;
      userData.achievements.push(`completed:${courseId}`);
      userData.totalPoints += 100; // Bonus for course completion
    }
  }
  
  await updateUserCourseData(username, userData);
  return true;
}

// Leaderboard
export async function getLeaderboard(limit: number = 20): Promise<LeaderboardEntry[]> {
  try {
    const redis = Redis.fromEnv();
    const keys = await redis.keys('courseData:*');
    
    const entries: LeaderboardEntry[] = [];
    
    for (const key of keys) {
      const username = key.replace('courseData:', '');
      const data = await redis.get<UserCourseData>(key);
      
      if (data) {
        const coursesCompleted = Object.values(data.courses).filter(c => c.completedAt).length;
        
        entries.push({
          username,
          totalPoints: data.totalPoints,
          coursesCompleted,
          achievements: data.achievements,
          rank: 0
        });
      }
    }
    
    // Sort by points and assign ranks
    entries.sort((a, b) => b.totalPoints - a.totalPoints);
    entries.forEach((entry, index) => {
      entry.rank = index + 1;
    });
    
    return entries.slice(0, limit);
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    return [];
  }
}

// Social Features
export async function followUser(followerUsername: string, targetUsername: string): Promise<boolean> {
  try {
    const redis = Redis.fromEnv();
    
    let followerData = await getUserCourseData(followerUsername);
    let targetData = await getUserCourseData(targetUsername);
    
    if (!followerData) {
      followerData = await initializeUserCourseData(followerUsername);
    }
    
    if (!targetData) {
      targetData = await initializeUserCourseData(targetUsername);
    }
    
    // Add to following/followers if not already
    if (!followerData.following.includes(targetUsername)) {
      followerData.following.push(targetUsername);
      await updateUserCourseData(followerUsername, followerData);
    }
    
    if (!targetData.followers.includes(followerUsername)) {
      targetData.followers.push(followerUsername);
      await updateUserCourseData(targetUsername, targetData);
    }
    
    return true;
  } catch (error) {
    console.error('Error following user:', error);
    return false;
  }
}

export async function unfollowUser(followerUsername: string, targetUsername: string): Promise<boolean> {
  try {
    let followerData = await getUserCourseData(followerUsername);
    let targetData = await getUserCourseData(targetUsername);
    
    if (followerData) {
      followerData.following = followerData.following.filter(u => u !== targetUsername);
      await updateUserCourseData(followerUsername, followerData);
    }
    
    if (targetData) {
      targetData.followers = targetData.followers.filter(u => u !== followerUsername);
      await updateUserCourseData(targetUsername, targetData);
    }
    
    return true;
  } catch (error) {
    console.error('Error unfollowing user:', error);
    return false;
  }
}

// Get all users (from Redis userCache)
export async function getAllUsers(): Promise<string[]> {
  try {
    const redis = Redis.fromEnv();
    const keys = await redis.keys('userCache:*');
    return keys.map(k => k.replace('userCache:', ''));
  } catch (error) {
    console.error('Error getting all users:', error);
    return [];
  }
}
