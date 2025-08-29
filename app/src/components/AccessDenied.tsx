import React from 'react';

interface AccessDeniedProps {
  role: string;
  requiredRole: string;
}

export const AccessDenied: React.FC<AccessDeniedProps> = ({ role, requiredRole }) => {
  const roleIcons = {
    'Property Appraiser': '🏗️',
    'Property Owner': '🏠',
    'Lending Platform': '🏦'
  };

  const getCurrentRoleIcon = () => roleIcons[role as keyof typeof roleIcons] || '👤';
  const getRequiredRoleIcon = () => roleIcons[requiredRole as keyof typeof roleIcons] || '👤';

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '400px',
      padding: '20px'
    }}>
      <div className="luxury-card text-center" style={{
        maxWidth: '600px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Animated Background Effect */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(ellipse at center, rgba(224, 17, 95, 0.1) 0%, transparent 70%)',
          animation: 'float 4s ease-in-out infinite',
          pointerEvents: 'none'
        }} />

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{
            fontSize: '5rem',
            marginBottom: '30px',
            animation: 'float 3s ease-in-out infinite',
            filter: 'drop-shadow(0 4px 8px rgba(224, 17, 95, 0.3))'
          }}>
            🚫
          </div>

          <h2 style={{
            marginBottom: '30px',
            fontSize: '3rem',
            background: 'linear-gradient(135deg, var(--color-ruby), var(--color-gold))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            Access Restricted
          </h2>

          <p style={{
            fontSize: '1.3rem',
            color: 'var(--color-platinum)',
            marginBottom: '40px',
            lineHeight: '1.6'
          }}>
            This section is reserved for authorized users only
          </p>

          {/* Role Comparison */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto 1fr',
            gap: '30px',
            alignItems: 'center',
            marginBottom: '40px',
            padding: '30px',
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)',
            border: '1px solid rgba(255, 215, 0, 0.1)',
            borderRadius: '20px'
          }}>
            {/* Current Role */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                fontSize: '3rem', 
                marginBottom: '15px',
                opacity: '0.6'
              }}>
                {getCurrentRoleIcon()}
              </div>
              <div className="badge badge-ruby" style={{ 
                fontSize: '0.9rem',
                padding: '8px 16px'
              }}>
                Current Role
              </div>
              <p style={{ 
                marginTop: '10px', 
                color: 'var(--color-silver)',
                fontSize: '1.1rem',
                fontWeight: '600'
              }}>
                {role}
              </p>
            </div>

            {/* Arrow */}
            <div style={{ 
              fontSize: '2.5rem',
              color: 'var(--color-gold)',
              animation: 'float 2s ease-in-out infinite'
            }}>
              →
            </div>

            {/* Required Role */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                fontSize: '3rem', 
                marginBottom: '15px',
                filter: 'drop-shadow(0 4px 8px rgba(255, 215, 0, 0.3))'
              }}>
                {getRequiredRoleIcon()}
              </div>
              <div className="badge badge-emerald" style={{ 
                fontSize: '0.9rem',
                padding: '8px 16px'
              }}>
                Required Role
              </div>
              <p style={{ 
                marginTop: '10px', 
                color: 'var(--color-ivory)',
                fontSize: '1.1rem',
                fontWeight: '600'
              }}>
                {requiredRole}
              </p>
            </div>
          </div>

          {/* Action Message */}
          <div style={{
            padding: '25px 30px',
            background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, rgba(255, 215, 0, 0.05) 100%)',
            border: '2px solid rgba(255, 215, 0, 0.2)',
            borderRadius: '20px',
            marginBottom: '30px'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              gap: '12px',
              fontSize: '1.2rem',
              color: 'var(--color-gold)',
              fontWeight: '600',
              marginBottom: '8px'
            }}>
              <span style={{ fontSize: '24px' }}>💡</span>
              Solution
            </div>
            <p style={{ 
              color: 'var(--color-platinum)',
              fontSize: '1.1rem',
              margin: 0,
              lineHeight: '1.5'
            }}>
              Switch to the <strong style={{ color: 'var(--color-gold)' }}>{requiredRole}</strong> role using the "Switch Role" button in the header to access this feature.
            </p>
          </div>

          {/* Enhanced Visual Elements */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '10px',
            opacity: '0.6'
          }}>
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: 'linear-gradient(45deg, var(--color-gold), var(--color-ruby))',
                  animation: `float ${2 + i * 0.5}s ease-in-out infinite`
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};