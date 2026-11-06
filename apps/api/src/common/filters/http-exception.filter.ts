import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Response } from "express";

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();

    if (exception instanceof Error && exception.name === "CastError") {
      response.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        message: "Data yang diminta tidak valid",
      });
      return;
    }

    if (exception instanceof Error && exception.name === "MulterError") {
      response.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        message: "Berkas tidak dapat diunggah. Maksimal 5 berkas, masing-masing 5 MB.",
      });
      return;
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      const message = this.extractMessage(body, exception.message);
      response.status(status).json({
        statusCode: status,
        message,
      });
      return;
    }

    this.logger.error(exception instanceof Error ? exception.stack : exception);
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: "Terjadi kesalahan pada server",
    });
  }

  private extractMessage(body: string | object, fallback: string): string | string[] {
    if (typeof body === "string") {
      return body;
    }

    if ("message" in body) {
      const message = (body as { message?: string | string[] }).message;
      if (typeof message === "string" || Array.isArray(message)) {
        return message;
      }
    }

    return fallback;
  }
}
