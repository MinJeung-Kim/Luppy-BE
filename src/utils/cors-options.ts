export const corsOptions = {
  origin: (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void,
  ) => {
    // 개발 환경에서는 모든 origin 허용
    if (process.env.ENV === 'dev') {
      callback(null, true);
      return;
    }

    // 운영 환경에서는 특정 도메인만 허용
    const allowedOrigins = ['https://mydomain.com', 'https://www.mydomain.com'];

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
};
