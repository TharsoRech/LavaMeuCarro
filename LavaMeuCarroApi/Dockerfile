FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY src/LavaMeuCarro.Domain/LavaMeuCarro.Domain.csproj src/LavaMeuCarro.Domain/
COPY src/LavaMeuCarro.Application/LavaMeuCarro.Application.csproj src/LavaMeuCarro.Application/
COPY src/LavaMeuCarro.Infrastructure/LavaMeuCarro.Infrastructure.csproj src/LavaMeuCarro.Infrastructure/
COPY src/LavaMeuCarro.API/LavaMeuCarro.API.csproj src/LavaMeuCarro.API/
RUN dotnet restore src/LavaMeuCarro.API/LavaMeuCarro.API.csproj

COPY . .
RUN dotnet publish src/LavaMeuCarro.API/LavaMeuCarro.API.csproj -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
EXPOSE 5050

ENV ASPNETCORE_URLS=http://+:5050
ENV ASPNETCORE_ENVIRONMENT=Production

COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "LavaMeuCarro.API.dll"]
