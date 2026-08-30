FROM node:22-alpine

WORKDIR /app
COPY package.json server.js ./
COPY index.html styles.css app.js mockData.js services-integration.js ./

USER node

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
	CMD wget --spider --quiet http://localhost:3000/health || exit 1
CMD ["node", "server.js"]