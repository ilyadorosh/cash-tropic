import { Redis } from '@upstash/redis';
import Link from 'next/link';
import { getAllCourses } from '@/app/lib/course-data';
import styles from '@/app/components/chat.module.scss';
import ChatGptIcon from '@/app/icons/InferiorAI.svg';

export default async function CoursesPage() {
  const courses = await getAllCourses();

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return '#4CAF50';
      case 'intermediate': return '#FF9800';
      case 'advanced': return '#f44336';
      default: return '#9E9E9E';
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'Anfänger';
      case 'intermediate': return 'Fortgeschritten';
      case 'advanced': return 'Experte';
      default: return difficulty;
    }
  };

  return (
    <div className={styles.chat}>
      <div className={styles['chat-body']} style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px' }}>
          <ChatGptIcon style={{ width: '48px', height: '48px' }} />
          <div>
            <h1 style={{ margin: 0, fontSize: '2rem' }}>📚 Kurskatalog</h1>
            <p style={{ margin: '5px 0 0', opacity: 0.7 }}>Lerne KI & LLMs für die Softwareentwicklung</p>
          </div>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', 
          gap: '20px' 
        }}>
          {courses.map((course) => (
            <Link 
              key={course.id} 
              href={`/courses/${course.id}`}
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <div style={{
                background: 'var(--white)',
                borderRadius: '12px',
                padding: '24px',
                border: 'var(--border-in-light)',
                boxShadow: 'var(--card-shadow)',
                transition: 'transform 0.2s, box-shadow 0.2s',
                cursor: 'pointer',
                height: '100%'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'var(--card-shadow)';
              }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <span style={{
                    background: getDifficultyColor(course.difficulty),
                    color: 'white',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '0.75rem',
                    fontWeight: '600'
                  }}>
                    {getDifficultyLabel(course.difficulty)}
                  </span>
                  <span style={{ fontSize: '0.85rem', opacity: 0.6 }}>
                    ⏱️ {course.estimatedHours}h
                  </span>
                </div>

                <h2 style={{ fontSize: '1.25rem', margin: '0 0 8px', lineHeight: 1.3 }}>
                  {course.title}
                </h2>
                
                <p style={{ fontSize: '0.9rem', opacity: 0.7, margin: '0 0 16px', lineHeight: 1.5 }}>
                  {course.description}
                </p>

                <div style={{ fontSize: '0.85rem', opacity: 0.6, marginBottom: '12px' }}>
                  👤 {course.author}
                </div>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
                  {course.tags.slice(0, 4).map((tag) => (
                    <span key={tag} style={{
                      background: 'var(--gray)',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '0.75rem'
                    }}>
                      {tag}
                    </span>
                  ))}
                </div>

                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  paddingTop: '12px',
                  borderTop: '1px solid var(--border-in-light)',
                  fontSize: '0.85rem',
                  opacity: 0.7
                }}>
                  <span>📖 {course.modules.length} Module</span>
                  <span>📝 {course.modules.reduce((sum, m) => sum + m.lessons.length, 0)} Lektionen</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {courses.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', opacity: 0.6 }}>
            <p style={{ fontSize: '1.2rem' }}>Keine Kurse verfügbar</p>
            <p>Kurse werden bald hinzugefügt!</p>
          </div>
        )}

        <div style={{ marginTop: '40px', textAlign: 'center' }}>
          <Link href="/leaderboard" style={{ 
            color: 'var(--primary)', 
            textDecoration: 'none',
            fontSize: '1rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            🏆 Zum Leaderboard →
          </Link>
        </div>
      </div>
    </div>
  );
}
