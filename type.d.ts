declare module 'express-serve-static-core' {
    interface Request {
      user?: any;
    }
    interface Response {
      user?: any;
    }
  }