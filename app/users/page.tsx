import { Redis } from '@upstash/redis';
import Link from 'next/link';
import styles from '@/app/components/chat.module.scss';
import ChatGptIcon from '@/app/icons/InferiorAI.svg';
import { getUserCourseData } from '@/app/lib/course-data';
import { UserCourseData } from '@/app/lib/course-types';

interface UserWithData {
  username: string;
  context: string | null;
  courseData: UserCourseData | null;
}

export default async function UsersPage() {
  const redis = Redis.fromEnv();
  const keys = await redis.keys('userCache:*');
  
  // Get user data in parallel
  const usersWithData: UserWithData[] = await Promise.all(
    keys.map(async (key) => {
      const username = key.replace('userCache:', '');
      const context = await redis.get<string>(key);
      const courseData = await getUserCourseData(username);
      return { username, context, courseData };
    })
  );

  // Sort by points (users with course data first)
  usersWithData.sort((a, b) => {
    const pointsA = a.courseData?.totalPoints || 0;
    const pointsB = b.courseData?.totalPoints || 0;
    return pointsB - pointsA;
  });

  return (
    <div className={styles.chat}>
      <div className={styles['chat-body']} style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px' }}>
          <ChatGptIcon style={{ width: '48px', height: '48px' }} />
          <div>
            <h1 style={{ margin: 0, fontSize: '2rem' }}>👥 Community</h1>
            <p style={{ margin: '5px 0 0', opacity: 0.7 }}>
              {usersWithData.length} Teilnehmer • Entdecke andere Lernende
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '16px',
          marginBottom: '30px'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, var(--primary) 0%, var(--second) 100%)',
            color: 'white',
            padding: '20px',
            borderRadius: '12px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2rem', fontWeight: '700' }}>{usersWithData.length}</div>
            <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Teilnehmer</div>
          </div>
          <div style={{
            background: 'var(--white)',
            border: 'var(--border-in-light)',
            padding: '20px',
            borderRadius: '12px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2rem', fontWeight: '700' }}>
              {usersWithData.filter(u => u.courseData && Object.keys(u.courseData.courses).length > 0).length}
            </div>
            <div style={{ fontSize: '0.9rem', opacity: 0.7 }}>Aktive Lerner</div>
          </div>
          <div style={{
            background: 'var(--white)',
            border: 'var(--border-in-light)',
            padding: '20px',
            borderRadius: '12px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2rem', fontWeight: '700' }}>
              {usersWithData.reduce((sum, u) => sum + (u.courseData?.totalPoints || 0), 0)}
            </div>
            <div style={{ fontSize: '0.9rem', opacity: 0.7 }}>Gesamtpunkte</div>
          </div>
        </div>

        {/* User Grid */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
          gap: '16px' 
        }}>
          {usersWithData.map((user, index) => (
            <Link 
              key={user.username} 
              href={`/user/${user.username}`}
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <div style={{
                background: 'var(--white)',
                borderRadius: '12px',
                padding: '20px',
                border: 'var(--border-in-light)',
                boxShadow: 'var(--card-shadow)',
                transition: 'transform 0.2s, box-shadow 0.2s',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'var(--card-shadow)';
              }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  {/* Avatar */}
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: `hsl(${(user.username.charCodeAt(0) * 137) % 360}, 70%, 60%)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: '700',
                    fontSize: '1.2rem'
                  }}>
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '600', fontSize: '1.1rem' }}>
                      {user.username}
                    </div>
                    {user.courseData && user.courseData.totalPoints > 0 && (
                      <div style={{ fontSize: '0.85rem', color: 'var(--primary)' }}>
                        ⭐ {user.courseData.totalPoints} Punkte
                      </div>
                    )}
                  </div>
                  {index < 3 && user.courseData && user.courseData.totalPoints > 0 && (
                    <div style={{ fontSize: '1.5rem' }}>
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                    </div>
                  )}
                </div>

                {/* Stats */}
                {user.courseData && (
                  <div style={{ 
                    display: 'flex', 
                    gap: '16px', 
                    fontSize: '0.8rem', 
                    opacity: 0.7,
                    marginBottom: '12px'
                  }}>
                    <span>📚 {Object.keys(user.courseData.courses).length} Kurse</span>
                    <span>🏆 {user.courseData.achievements.length} Erfolge</span>
                    <span>👥 {user.courseData.followers.length} Follower</span>
                  </div>
                )}

                {/* Context Preview */}
                {user.context && (
                  <div style={{ 
                    fontSize: '0.85rem', 
                    opacity: 0.6,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    lineHeight: 1.4
                  }}>
                    {typeof user.context === 'string' 
                      ? user.context.substring(0, 100) 
                      : JSON.stringify(user.context).substring(0, 100)}...
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>

        {usersWithData.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', opacity: 0.6 }}>
            <p style={{ fontSize: '1.2rem' }}>Keine Benutzer gefunden</p>
          </div>
        )}

        {/* Navigation */}
        <div style={{ 
          marginTop: '40px', 
          display: 'flex',
          justifyContent: 'center',
          gap: '24px'
        }}>
          <Link href="/courses" style={{ 
            color: 'var(--primary)', 
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            📚 Kurskatalog
          </Link>
          <Link href="/leaderboard" style={{ 
            color: 'var(--primary)', 
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            🏆 Leaderboard
          </Link>
        </div>
      </div>
    </div>
  );
}
