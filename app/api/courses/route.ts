import { NextResponse } from 'next/server';
import { getAllCourses } from '@/app/lib/course-data';

export async function GET() {
  try {
    const courses = await getAllCourses();
    
    // Return simplified course list (without full lesson content)
    const courseList = courses.map(course => ({
      id: course.id,
      title: course.title,
      description: course.description,
      author: course.author,
      difficulty: course.difficulty,
      estimatedHours: course.estimatedHours,
      tags: course.tags,
      moduleCount: course.modules.length,
      lessonCount: course.modules.reduce((sum, m) => sum + m.lessons.length, 0)
    }));
    
    return NextResponse.json(courseList);
  } catch (error) {
    console.error('Error fetching courses:', error);
    return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 });
  }
}
