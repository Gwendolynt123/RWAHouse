import React from 'react';

interface AccessDeniedProps {
  role: string;
  requiredRole: string;
}

export const AccessDenied: React.FC<AccessDeniedProps> = ({ role, requiredRole }) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '300px',
      backgroundColor: '#f8f9fa',
      border: '1px solid #dee2e6',
      borderRadius: '8px',
      margin: '20px',
      padding: '40px'
    }}>
      <div style={{
        fontSize: '48px',
        marginBottom: '20px',
        color: '#dc3545'
      }}>
        🚫
      </div>
      <h2 style={{
        color: '#dc3545',
        marginBottom: '15px',
        textAlign: 'center'
      }}>
        您无权访问此页面
      </h2>
      <p style={{
        color: '#6c757d',
        textAlign: 'center',
        fontSize: '16px',
        marginBottom: '10px'
      }}>
        当前角色：{role}
      </p>
      <p style={{
        color: '#6c757d',
        textAlign: 'center',
        fontSize: '16px'
      }}>
        需要角色：{requiredRole}
      </p>
      <div style={{
        marginTop: '20px',
        padding: '10px 20px',
        backgroundColor: '#fff3cd',
        border: '1px solid #ffeaa7',
        borderRadius: '4px',
        color: '#856404'
      }}>
        请选择正确的角色后重新访问
      </div>
    </div>
  );
};