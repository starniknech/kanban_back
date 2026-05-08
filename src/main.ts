/** For Vitalii*/
import 'dotenv/config';
import * as dns from 'node:dns';
/** For Vitalii*/

import * as cookieParser from 'cookie-parser';
import * as express from 'express';
import { join } from 'path';
import helmet from 'helmet';
import { NestFactory } from '@nestjs/core';

/** For Vitalii*/
dns.setServers(['8.8.8.8', '1.1.1.1']);

async function start() {
  try {
    /** For Vitalii*/
    const { AppModule } = await import('./app.module');

    const PORT = process.env.PORT;
    const app = await NestFactory.create(AppModule);

    app.enableCors({
      origin: process.env.FRONTEND_URL,
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
      credentials: true,
    });

    app.use(
      helmet({
        crossOriginResourcePolicy: { policy: 'cross-origin' },
      }),
    );

    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    app.use('/uploads', express.static(join(__dirname, '..', 'uploads')));
    app.use(cookieParser());

    await app.listen(PORT);
    console.log(`Server started on PORT ${PORT}`);
  } catch (error) {
    console.error('Error starting server:', error);
  }
}

start();
