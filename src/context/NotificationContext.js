import React, { createContext, useContext, useState } from 'react';

const NotificationContext = createContext();

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([
        {
            id: 1,
            type: 'alert',
            title: 'Signs of leaf eating caterpillar',
            message: 'Blah Blah Blah',
            isVisible: true,
        }
    ]);

    const dismissNotification = (id) => {
        setNotifications(prev =>
            prev.map(notification =>
                notification.id === id
                    ? { ...notification, isVisible: false }
                    : notification
            )
        );
    };

    const getVisibleNotifications = () =>
        notifications.filter(notification => notification.isVisible);

    return (
        <NotificationContext.Provider
            value={{
                notifications: getVisibleNotifications(),
                dismissNotification,
            }}
        >
            {children}
        </NotificationContext.Provider>
    );
};