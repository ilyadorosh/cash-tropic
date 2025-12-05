import { Redis } from '@upstash/redis';
import Link from 'next/link';
import styles from '@/app/components/chat.module.scss';
import ChatGptIcon from '@/app/icons/InferiorAI.svg';
import { getUserCourseData, getAllCourses } from '@/app/lib/course-data';
import { UserCourseData } from '@/app/lib/course-types';

interface LeaderboardUser {
  username: string;
  totalPoints: number;
  coursesEnrolled: number;
  coursesCompleted: number;
  achievements: string[];
  rank: number;
}

export default async function LeaderboardPage() {
  const redis = Redis.fromEnv();
  const keys = await redis.keys('userCache:*');
  const courses = await getAllCourses();
  
  // Gather user data
  const users: LeaderboardUser[] = await Promise.all(
    keys.map(async (key) => {
      const username = key.replace('userCache:', '');
      const courseData = await getUserCourseData(username);
      
      const coursesEnrolled = courseData ? Object.keys(courseData.courses).length : 0;
      const coursesCompleted = courseData 
        ? Object.values(courseData.courses).filter(c => c.completedAt).length 
        : 0;
      
      return {
        username,
        totalPoints: courseData?.totalPoints || 0,
        coursesEnrolled,
        coursesCompleted,
        achievements: courseData?.achievements || [],
        rank: 0
      };
    })
  );

  // Sort by points and assign ranks
  users.sort((a, b) => b.totalPoints - a.totalPoints);
  users.forEach((user, index) => {
    user.rank = index + 1;
  });

  // Only show users with some activity
  const activeUsers = users.filter(u => u.totalPoints > 0 || u.coursesEnrolled > 0);
  const topUsers = activeUsers.slice(0, 50);

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return { background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)', color: '#333' };
      case 2:
        return { background: 'linear-gradient(135deg, #C0C0C0 0%, #A0A0A0 100%)', color: '#333' };
      case 3:
        return { background: 'linear-gradient(135deg, #CD7F32 0%, #8B4513 100%)', color: 'white' };
      default:
        return { background: 'var(--gray)', color: 'inherit' };
    }
  };

  const getRankEmoji = (rank: number) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${rank}`;
    }
  };

  return (
    <div className={styles.chat}>
      <div className={styles['chat-body']} style={{ padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px' }}>
          <ChatGptIcon style={{ width: '48px', height: '48px' }} />
          <div>
            <h1 style={{ margin: 0, fontSize: '2rem' }}>🏆 Leaderboard</h1>
            <p style={{ margin: '5px 0 0', opacity: 0.7 }}>
              Top Lerner im AI & LLM Workshop
            </p>
          </div>
        </div>

        {/* Stats Overview */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
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
            <div style={{ fontSize: '2.5rem', fontWeight: '700' }}>{activeUsers.length}</div>
            <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Aktive Teilnehmer</div>
          </div>
          <div style={{
            background: 'var(--white)',
            border: 'var(--border-in-light)',
            padding: '20px',
            borderRadius: '12px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2.5rem', fontWeight: '700' }}>
              {activeUsers.reduce((sum, u) => sum + u.coursesCompleted, 0)}
            </div>
            <div style={{ fontSize: '0.9rem', opacity: 0.7 }}>Abgeschlossene Kurse</div>
          </div>
          <div style={{
            background: 'var(--white)',
            border: 'var(--border-in-light)',
            padding: '20px',
            borderRadius: '12px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2.5rem', fontWeight: '700' }}>
              {activeUsers.reduce((sum, u) => sum + u.totalPoints, 0)}
            </div>
            <div style={{ fontSize: '0.9rem', opacity: 0.7 }}>Gesamtpunkte</div>
          </div>
        </div>

        {/* Top 3 Podium */}
        {topUsers.length >= 3 && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-end',
            gap: '16px',
            marginBottom: '40px',
            padding: '20px'
          }}>
            {/* 2nd Place */}
            <Link href={`/user/${topUsers[1].username}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div style={{
                background: 'linear-gradient(135deg, #C0C0C0 0%, #A0A0A0 100%)',
                borderRadius: '12px',
                padding: '20px',
                textAlign: 'center',
                width: '140px'
              }}>
                <div style={{ fontSize: '2rem' }}>🥈</div>
                <div style={{ fontWeight: '600', marginTop: '8px' }}>{topUsers[1].username}</div>
                <div style={{ fontSize: '1.2rem', fontWeight: '700', marginTop: '4px' }}>
                  {topUsers[1].totalPoints} Pts
                </div>
              </div>
            </Link>

            {/* 1st Place */}
            <Link href={`/user/${topUsers[0].username}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div style={{
                background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                borderRadius: '12px',
                padding: '24px',
                textAlign: 'center',
                width: '160px',
                transform: 'scale(1.1)'
              }}>
                <div style={{ fontSize: '2.5rem' }}>🥇</div>
                <div style={{ fontWeight: '700', marginTop: '8px', fontSize: '1.1rem' }}>
                  {topUsers[0].username}
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: '700', marginTop: '4px' }}>
                  {topUsers[0].totalPoints} Pts
                </div>
              </div>
            </Link>

            {/* 3rd Place */}
            <Link href={`/user/${topUsers[2].username}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div style={{
                background: 'linear-gradient(135deg, #CD7F32 0%, #8B4513 100%)',
                borderRadius: '12px',
                padding: '16px',
                textAlign: 'center',
                width: '130px',
                color: 'white'
              }}>
                <div style={{ fontSize: '1.8rem' }}>🥉</div>
                <div style={{ fontWeight: '600', marginTop: '8px' }}>{topUsers[2].username}</div>
                <div style={{ fontSize: '1.1rem', fontWeight: '700', marginTop: '4px' }}>
                  {topUsers[2].totalPoints} Pts
                </div>
              </div>
            </Link>
          </div>
        )}

        {/* Full Leaderboard Table */}
        <div style={{
          background: 'var(--white)',
          borderRadius: '12px',
          border: 'var(--border-in-light)',
          overflow: 'hidden'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '60px 1fr 100px 100px 100px',
            padding: '16px 20px',
            background: 'var(--gray)',
            fontWeight: '600',
            fontSize: '0.85rem'
          }}>
            <div>Rang</div>
            <div>Teilnehmer</div>
            <div style={{ textAlign: 'center' }}>Punkte</div>
            <div style={{ textAlign: 'center' }}>Kurse</div>
            <div style={{ textAlign: 'center' }}>Erfolge</div>
          </div>

          {topUsers.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', opacity: 0.6 }}>
              <p>Noch keine aktiven Teilnehmer</p>
              <p style={{ fontSize: '0.9rem' }}>Sei der Erste! Starte einen Kurs und sammle Punkte.</p>
            </div>
          ) : (
            topUsers.map((user) => (
              <Link 
                key={user.username}
                href={`/user/${user.username}`}
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '60px 1fr 100px 100px 100px',
                  padding: '16px 20px',
                  borderTop: 'var(--border-in-light)',
                  alignItems: 'center',
                  transition: 'background 0.2s',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--gray)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
                >
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '700',
                    fontSize: user.rank <= 3 ? '1.2rem' : '0.9rem',
                    ...getRankStyle(user.rank)
                  }}>
                    {getRankEmoji(user.rank)}
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: `hsl(${(user.username.charCodeAt(0) * 137) % 360}, 70%, 60%)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: '600'
                    }}>
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <span style={{ fontWeight: '500' }}>{user.username}</span>
                  </div>
                  
                  <div style={{ textAlign: 'center', fontWeight: '600', color: 'var(--primary)' }}>
                    {user.totalPoints}
                  </div>
                  
                  <div style={{ textAlign: 'center' }}>
                    {user.coursesCompleted}/{user.coursesEnrolled}
                  </div>
                  
                  <div style={{ textAlign: 'center' }}>
                    {user.achievements.length > 0 
                      ? `🏆 ${user.achievements.length}`
                      : '-'
                    }
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>

        {/* Available Courses */}
        <div style={{ marginTop: '40px' }}>
          <h2 style={{ fontSize: '1.3rem', marginBottom: '16px' }}>📚 Verfügbare Kurse</h2>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {courses.map((course) => (
              <Link 
                key={course.id}
                href={`/courses/${course.id}`}
                style={{
                  background: 'var(--white)',
                  border: 'var(--border-in-light)',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  textDecoration: 'none',
                  color: 'inherit',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <span>📖</span>
                <span>{course.title}</span>
              </Link>
            ))}
          </div>
        </div>

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
          <Link href="/users" style={{ 
            color: 'var(--primary)', 
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            👥 Community
          </Link>
        </div>
      </div>
    </div>
  );
}
