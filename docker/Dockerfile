ARG PHP_VERSION=8.5
ARG NODE_VERSION=24

FROM composer:2 AS composer
FROM node:${NODE_VERSION}-alpine AS node
FROM mlocati/php-extension-installer:2 AS php-ext

FROM php:${PHP_VERSION}-fpm-alpine

COPY --from=composer /usr/bin/composer /usr/bin/composer
COPY --from=php-ext /usr/bin/install-php-extensions /usr/local/bin/
COPY --from=node /usr/local/bin/node /usr/local/bin/
COPY --from=node /usr/local/lib/node_modules /usr/local/lib/node_modules
RUN ln -s ../lib/node_modules/npm/bin/npm-cli.js /usr/local/bin/npm

RUN apk --no-cache add bash su-exec postgresql-client libstdc++ \
    && install-php-extensions pdo_pgsql pgsql gd bcmath zip exif pcntl redis

WORKDIR /usr/share/caddy/html/

COPY composer.json composer.lock ./
RUN composer validate --strict \
    && composer install --no-interaction --no-progress --no-scripts --no-autoloader --no-dev \
    && composer clear-cache

COPY package.json package-lock.json .npmrc ./
RUN npm ci --no-audit --no-fund

COPY . .

RUN composer dump-autoload --optimize --no-dev \
    && php artisan package:discover --ansi \
    && npm run build \
    && rm -rf node_modules \
    && npm cache clean --force \
    && chmod -R a+rX . \
    && chown -R www-data:www-data storage bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache \
    && cp -a public /usr/share/laraowl-public

COPY docker/php-fpm-entrypoint /usr/local/bin/php-entrypoint
RUN chmod a+x /usr/local/bin/php-entrypoint

ENTRYPOINT ["/usr/local/bin/php-entrypoint"]
CMD ["php-fpm"]
