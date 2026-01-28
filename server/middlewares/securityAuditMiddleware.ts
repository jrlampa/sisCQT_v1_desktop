import type { RequestHandler } from 'express';
import fs from 'node:fs';
import path from 'node:path';

type SecurityAuditEvent = {
  ts: string;
  kind: 'security';
  status: 401 | 403 | 429;
  method: string;
  path: string;
  ip?: string;
  userId?: string;
  userEmail?: string;
  userAgent?: string;
  requestId?: string;
};

function ensureParentDir(filePath: string) {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
}

function writeAuditLine(line: string) {
  const auditPath = (process.env.SECURITY_AUDIT_PATH || '').trim();
  if (auditPath) {
    try {
      ensureParentDir(auditPath);
      fs.appendFileSync(auditPath, `${line}\n`, { encoding: 'utf8' });
      return;
    } catch (e) {
      // Fallback: não falhar request por erro de IO.
      // eslint-disable-next-line no-console
      console.warn('[security-audit] falha ao escrever arquivo, fallback para console.', e);
    }
  }
  // eslint-disable-next-line no-console
  console.warn('[security-audit]', line);
}

/**
 * Audit trail opcional para eventos de segurança (401/403/429).
 *
 * - Ativa com `SECURITY_AUDIT_ENABLED=true`
 * - Opcional: `SECURITY_AUDIT_PATH=...` para gerar evidência em arquivo NDJSON
 *
 * Nunca loga o token, payloads ou headers sensíveis.
 */
export function securityAuditMiddleware(): RequestHandler {
  const enabled = process.env.SECURITY_AUDIT_ENABLED === 'true';
  if (!enabled) {
    return (_req, _res, next) => next();
  }

  return (req: any, res, next) => {
    res.on('finish', () => {
      const status = res.statusCode;
      if (status !== 401 && status !== 403 && status !== 429) return;

      const user = req.user as { id?: string; email?: string } | undefined;
      const ev: SecurityAuditEvent = {
        ts: new Date().toISOString(),
        kind: 'security',
        status,
        method: String(req.method || ''),
        path: String(req.originalUrl || req.url || ''),
        ip: typeof req.ip === 'string' ? req.ip : undefined,
        userId: user?.id,
        userEmail: user?.email,
        userAgent: typeof req.headers?.['user-agent'] === 'string' ? req.headers['user-agent'] : undefined,
        requestId: typeof req.headers?.['x-request-id'] === 'string' ? req.headers['x-request-id'] : undefined,
      };

      writeAuditLine(JSON.stringify(ev));
    });
    next();
  };
}

