# API IMMO PILOT (ASP.NET Core 10) — image de production
# Construction : docker build -t immopilot-api ./backend
# Les secrets (base de données, JWT, Brevo, Cloudinary…) sont fournis par l'hébergeur en variables d'environnement.

# ---- Étape 1 : compilation ----
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY ImmoPilot.Api/ImmoPilot.Api.csproj ImmoPilot.Api/
RUN dotnet restore ImmoPilot.Api/ImmoPilot.Api.csproj -r linux-x64
COPY ImmoPilot.Api/ ImmoPilot.Api/
RUN dotnet publish ImmoPilot.Api/ImmoPilot.Api.csproj -c Release -r linux-x64 --self-contained false -o /app --no-restore

# ---- Étape 2 : exécution (image légère, utilisateur non administrateur) ----
FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
COPY --from=build /app .
ENV ASPNETCORE_ENVIRONMENT=Production \
    ASPNETCORE_HTTP_PORTS=8080
EXPOSE 8080
USER $APP_UID
ENTRYPOINT ["dotnet", "ImmoPilot.Api.dll"]
