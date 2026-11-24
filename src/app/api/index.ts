/**
 * Punto de entrada de la capa api. Reexporta el cliente generado por orval (src/app/api/generated, no versionado).
 * Los mocks MSW se exportan aparte en ./mocks para que nunca entren en el bundle de producción.
 */
export * from './generated/endpoints/companies/companies.service';
export * from './generated/endpoints/session/session.service';
export * from './generated/model';
