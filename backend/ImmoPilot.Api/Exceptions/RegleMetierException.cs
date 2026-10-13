namespace ImmoPilot.Api.Exceptions;

// Levée quand une demande est valide dans sa forme mais contraire aux règles de gestion
// (ex : supprimer un immeuble qui a encore des logements). Renvoyée au client en 409 Conflict.
public class RegleMetierException(string message) : Exception(message);

// Levée quand les données envoyées sont incohérentes (ex : immeuble inconnu, fin de bail avant le début).
// Renvoyée au client en 400 Bad Request.
public class DonneesInvalidesException(string message) : Exception(message);
