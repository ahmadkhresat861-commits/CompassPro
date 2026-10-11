              {!loading &&
                !error &&
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    style={{
                      padding: '15px 20px',
                      borderBottom: `1px solid ${
                        darkMode
                          ? '#2e2e3e'
                          : '#f0f0f0'
                      }`,
                      cursor: 'pointer',
                      transition:
                        'background 0.15s',
                    }}
                    onMouseOver={(e) =>
                      (e.currentTarget.style.background =
                        darkMode
                          ? '#2a2a3a'
                          : '#f9f9f9')
                    }
                    onMouseOut={(e) =>
                      (e.currentTarget.style.background =
                        'transparent')
                    }
                  >
                    <div
                      style={{
                        display: 'flex',
                        gap: '12px',
                        alignItems:
                          'flex-start',
                      }}
                    >

                      <div
                        style={{
                          width: '35px',
                          height: '35px',
                          borderRadius: '50%',
                          background: '#003366',
                          display: 'flex',
                          alignItems:
                            'center',
                          justifyContent:
                            'center',
                          flexShrink: 0,
                        }}
                      >
                        <i
                          className="fas fa-bell"
                          style={{
                            color: '#f0a500',
                            fontSize:
                              '0.9rem',
                          }}
                        ></i>
                      </div>

                      <div>
                        <p
                          style={{
                            margin: 0,
                            fontSize: '0.9rem',
                            color: darkMode
                              ? '#eee'
                              : '#333',
                            fontWeight: '600',
                          }}
                        >
                          {notif.title}
                        </p>

                        <p
                          style={{
                            margin:
                              '4px 0 0',
                            fontSize:
                              '0.85rem',
                            color: darkMode
                              ? '#aaa'
                              : '#555',
                          }}
                        >
                          {notif.message}
                        </p>

                        <p
                          style={{
                            margin:
                              '4px 0 0',
                            fontSize:
                              '0.75rem',
                            color: '#888',
                          }}
                        >
                          {formatDate(
                            notif.created_at
                          )}
                        </p>
                      </div>

                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
