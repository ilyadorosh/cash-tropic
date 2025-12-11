import Link from 'next/link';
import { getCourseById } from '@/app/lib/course-data';
import { Course, Module, Lesson, TextContent, QuizContent } from '@/app/lib/course-types';
import styles from '@/app/components/chat.module.scss';
import ChatGptIcon from '@/app/icons/InferiorAI.svg';

// Lesson Type Icons
const lessonTypeIcons: Record<string, string> = {
  video: '🎬',
  text: '📖',
  quiz: '❓',
  challenge: '🎯',
  playground: '🎮'
};

const lessonTypeLabels: Record<string, string> = {
  video: 'Video',
  text: 'Lektion',
  quiz: 'Quiz',
  challenge: 'Challenge',
  playground: 'Playground'
};

function TextLessonContent({ content }: { content: TextContent }) {
  return (
    <div 
      style={{ 
        fontSize: '1rem', 
        lineHeight: 1.8,
        whiteSpace: 'pre-wrap'
      }}
      dangerouslySetInnerHTML={{ 
        __html: content.text
          .replace(/^### (.+)$/gm, '<h3 style="margin: 24px 0 12px; font-size: 1.1rem;">$1</h3>')
          .replace(/^## (.+)$/gm, '<h2 style="margin: 32px 0 16px; font-size: 1.3rem;">$1</h2>')
          .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
          .replace(/`([^`]+)`/g, '<code style="background: var(--gray); padding: 2px 6px; border-radius: 4px; font-size: 0.9em;">$1</code>')
          .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre style="background: var(--gray); padding: 16px; border-radius: 8px; overflow-x: auto; margin: 16px 0;"><code>$2</code></pre>')
          .replace(/\n- /g, '\n• ')
          .replace(/✅/g, '<span style="color: #4CAF50;">✅</span>')
          .replace(/❌/g, '<span style="color: #f44336;">❌</span>')
      }}
    />
  );
}

function QuizLessonContent({ content, lessonId }: { content: QuizContent; lessonId: string }) {
  return (
    <div>
      <p style={{ marginBottom: '24px', opacity: 0.7 }}>
        Teste dein Wissen mit {content.questions.length} Fragen:
      </p>
      {content.questions.map((q, idx) => (
        <div key={idx} style={{ 
          background: 'var(--gray)', 
          padding: '20px', 
          borderRadius: '12px',
          marginBottom: '16px'
        }}>
          <p style={{ fontWeight: '600', marginBottom: '16px' }}>
            {idx + 1}. {q.question}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {q.options.map((option, optIdx) => (
              <label key={optIdx} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                background: 'var(--white)',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'background 0.2s'
              }}>
                <input 
                  type="radio" 
                  name={`quiz-${lessonId}-${idx}`}
                  style={{ width: '18px', height: '18px' }}
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
          <details style={{ marginTop: '16px' }}>
            <summary style={{ cursor: 'pointer', color: 'var(--primary)' }}>
              💡 Lösung anzeigen
            </summary>
            <div style={{ 
              marginTop: '12px', 
              padding: '12px', 
              background: 'rgba(76, 175, 80, 0.1)',
              borderRadius: '8px',
              borderLeft: '4px solid #4CAF50'
            }}>
              <p style={{ margin: '0 0 8px', fontWeight: '600' }}>
                ✅ Richtige Antwort: {q.options[q.correct]}
              </p>
              <p style={{ margin: 0, opacity: 0.8 }}>{q.explanation}</p>
            </div>
          </details>
        </div>
      ))}
    </div>
  );
}

export default async function CourseDetailPage({
  params,
}: {
  params: { courseId: string };
}) {
  const course = await getCourseById(params.courseId);

  if (!course) {
    return (
      <div className={styles.chat}>
        <div className={styles['chat-body']} style={{ padding: '40px', textAlign: 'center' }}>
          <h1>Kurs nicht gefunden</h1>
          <p>Der angeforderte Kurs existiert nicht.</p>
          <Link href="/courses" style={{ color: 'var(--primary)' }}>
            ← Zurück zum Kurskatalog
          </Link>
        </div>
      </div>
    );
  }

  const totalLessons = course.modules.reduce((sum, m) => sum + m.lessons.length, 0);

  return (
    <div className={styles.chat}>
      <div className={styles['chat-body']} style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '30px' }}>
          <Link href="/courses" style={{ 
            color: 'var(--primary)', 
            textDecoration: 'none',
            fontSize: '0.9rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            marginBottom: '16px'
          }}>
            ← Zurück zum Kurskatalog
          </Link>
          
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px' }}>
            <ChatGptIcon style={{ width: '64px', height: '64px', flexShrink: 0 }} />
            <div>
              <h1 style={{ margin: '0 0 8px', fontSize: '1.8rem', lineHeight: 1.2 }}>
                {course.title}
              </h1>
              <p style={{ margin: '0 0 12px', opacity: 0.7, fontSize: '1.1rem' }}>
                {course.description}
              </p>
              <div style={{ display: 'flex', gap: '20px', fontSize: '0.9rem', opacity: 0.6 }}>
                <span>👤 {course.author}</span>
                <span>⏱️ {course.estimatedHours} Stunden</span>
                <span>📖 {course.modules.length} Module</span>
                <span>📝 {totalLessons} Lektionen</span>
              </div>
            </div>
          </div>
        </div>

        {/* Course Progress Bar (placeholder) */}
        <div style={{ 
          background: 'var(--gray)', 
          borderRadius: '8px', 
          padding: '16px 20px',
          marginBottom: '30px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ 
              height: '8px', 
              background: 'var(--white)', 
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <div style={{ 
                width: '0%', 
                height: '100%', 
                background: 'var(--primary)',
                transition: 'width 0.3s'
              }} />
            </div>
          </div>
          <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>0% abgeschlossen</span>
        </div>

        {/* Modules */}
        {course.modules.map((module, moduleIdx) => (
          <div key={module.id} style={{ marginBottom: '32px' }}>
            <div style={{
              background: 'var(--white)',
              borderRadius: '12px',
              border: 'var(--border-in-light)',
              overflow: 'hidden'
            }}>
              {/* Module Header */}
              <div style={{
                padding: '20px 24px',
                borderBottom: 'var(--border-in-light)',
                background: 'linear-gradient(135deg, var(--primary) 0%, var(--second) 100%)',
                color: 'white'
              }}>
                <h2 style={{ margin: 0, fontSize: '1.2rem' }}>
                  Modul {moduleIdx + 1}: {module.title}
                </h2>
                <p style={{ margin: '8px 0 0', opacity: 0.9, fontSize: '0.9rem' }}>
                  {module.description}
                </p>
              </div>

              {/* Lessons */}
              <div>
                {module.lessons.map((lesson, lessonIdx) => (
                  <details key={lesson.id} style={{ 
                    borderBottom: lessonIdx < module.lessons.length - 1 ? 'var(--border-in-light)' : 'none'
                  }}>
                    <summary style={{
                      padding: '16px 24px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      userSelect: 'none',
                      listStyle: 'none'
                    }}>
                      <span style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: 'var(--gray)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1rem'
                      }}>
                        {lessonTypeIcons[lesson.type] || '📄'}
                      </span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '500' }}>{lesson.title}</div>
                        <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>
                          {lessonTypeLabels[lesson.type] || lesson.type}
                        </div>
                      </div>
                      <span style={{ 
                        fontSize: '1.2rem',
                        transition: 'transform 0.2s'
                      }}>▶</span>
                    </summary>
                    
                    <div style={{ 
                      padding: '20px 24px', 
                      background: 'var(--gray)',
                      borderTop: 'var(--border-in-light)'
                    }}>
                      {lesson.type === 'text' && (
                        <TextLessonContent content={lesson.content as TextContent} />
                      )}
                      {lesson.type === 'quiz' && (
                        <QuizLessonContent 
                          content={lesson.content as QuizContent} 
                          lessonId={lesson.id}
                        />
                      )}
                      {(lesson.type === 'challenge' || lesson.type === 'playground') && (
                        <div>
                          <p style={{ fontStyle: 'italic', opacity: 0.7 }}>
                            🎯 Interaktive {lessonTypeLabels[lesson.type]} - Öffne den Kurs im Lernmodus für volle Funktionalität.
                          </p>
                          <pre style={{ 
                            background: 'var(--white)', 
                            padding: '16px', 
                            borderRadius: '8px',
                            overflow: 'auto',
                            fontSize: '0.85rem'
                          }}>
                            {JSON.stringify(lesson.content, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </details>
                ))}
              </div>
            </div>
          </div>
        ))}

        {/* Navigation */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          marginTop: '40px',
          padding: '20px 0',
          borderTop: 'var(--border-in-light)'
        }}>
          <Link href="/courses" style={{ 
            color: 'var(--primary)', 
            textDecoration: 'none' 
          }}>
            ← Alle Kurse
          </Link>
          <Link href="/leaderboard" style={{ 
            color: 'var(--primary)', 
            textDecoration: 'none' 
          }}>
            🏆 Leaderboard →
          </Link>
        </div>
      </div>
    </div>
  );
}
