import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Request, Response } from "express";

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let message = "Internal Server Error";
    let errors: any = null;

    if (exception instanceof HttpException) {
      const resp = exception.getResponse();
      if (typeof resp === "string") {
        message = resp;
      } else if (typeof resp === "object" && resp !== null) {
        message = (resp as any).message || (resp as any).error || message;
        errors = (resp as any).errors || null;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    if (status >= 500) {
      this.logger.error(`[${request.method}] ${request.url} - ${message}`, (exception as any)?.stack);
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      message,
      ...(errors && { errors }),
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
