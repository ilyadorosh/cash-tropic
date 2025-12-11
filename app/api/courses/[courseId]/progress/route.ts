import { NextResponse } from 'next/server';
import { updateLessonProgress, enrollInCourse } from '@/app/lib/course-data';

export async function POST(
  request: Request,
  { params }: { params: { courseId: string } }
) {
  try {
    const body = await request.json();
    const { username, moduleId, lessonId, completed, score, action } = body;
    
    if (!username) {
      return NextResponse.json({ error: 'Username required' }, { status: 400 });
    }
    
    // Handle enrollment
    if (action === 'enroll') {
      const progress = await enrollInCourse(username, params.courseId);
      return NextResponse.json({ success: true, progress });
    }
    
    // Handle lesson progress update
    if (!moduleId || !lessonId) {
      return NextResponse.json({ error: 'moduleId and lessonId required' }, { status: 400 });
    }
    
    const success = await updateLessonProgress(
      username,
      params.courseId,
      moduleId,
      lessonId,
      completed ?? true,
      score
    );
    
    if (!success) {
      return NextResponse.json({ error: 'Failed to update progress' }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating progress:', error);
    return NextResponse.json({ error: 'Failed to update progress' }, { status: 500 });
  }
}
