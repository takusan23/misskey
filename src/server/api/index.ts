/**
 * API Server
 */

import * as Koa from 'koa';
import * as Router from '@koa/router';
import * as multer from '@koa/multer';
import * as bodyParser from 'koa-bodyparser';
import * as cors from '@koa/cors';

import endpoints from './endpoints';
import handler from './api-handler';
import signup from './private/signup';
import signin from './private/signin';
import discord from './service/discord';
import github from './service/github';
import twitter from './service/twitter';
import Instance from '../../models/instance';
import { toApHost } from '../../misc/convert-host';
import { unique } from '../../prelude/array';
import config from '../../config';

// Init app
const app = new Koa();

// Handle error
app.use(async (ctx, next) => {
	try {
		await next();
	} catch (err) {
		if (err.code === 'LIMIT_FILE_SIZE') {
			ctx.throw('File to large', 413);
			return;
		}
		ctx.app.emit('error', err, ctx);
	}
});

// CORS
if (config.disableApiCors === true) {
	// do nothing
} else {
	app.use(cors({
		origin: '*'
	}));
}

// No caching
app.use(async (ctx, next) => {
	ctx.set('Cache-Control', 'private, max-age=0, must-revalidate');
	await next();
});

app.use(bodyParser({
	// リクエストが multipart/form-data でない限りはJSONだと見なす
	detectJSON: ctx => !ctx.is('multipart/form-data')
}));

// Init multer instance
const upload = multer({
	storage: multer.diskStorage({}),
	limits: {
		fileSize: config.maxFileSize || 262144000,
		files: 1,
	}
});

// Init router
const router = new Router();

/**
 * Register endpoint handlers
 */
for (const endpoint of endpoints) {
	if (endpoint.meta.requireFile) {
		router.post(`/${endpoint.name}`, upload.single('file'), handler.bind(null, endpoint));
	} else {
		if (endpoint.name.includes('-')) {
			// 後方互換性のため
			router.post(`/${endpoint.name.replace(/\-/g, '_')}`, handler.bind(null, endpoint));
		}
		router.post(`/${endpoint.name}`, handler.bind(null, endpoint));

		if (endpoint.meta.allowGet) {
			router.get(`/${endpoint.name}`, handler.bind(null, endpoint));
		} else {
			router.get(`/${endpoint.name}`, async ctx => { ctx.status = 405; });
		}
	}
}

router.post('/signup', signup);
router.post('/signin', signin);

router.use(discord.routes());
router.use(github.routes());
router.use(twitter.routes());

router.get('/v1/instance/peers', async ctx => {
	if (config.disableFederation) ctx.throw(404);

	const instances = await Instance.find({
		}, {
			host: 1
		});

	const punyCodes = unique(instances.map(instance => toApHost(instance.host)));

	ctx.body = punyCodes;
	ctx.set('Cache-Control', 'public, max-age=600');
});

// Return 404 for unknown API
router.all('*', async ctx => {
	ctx.status = 404;
});

// Register router
app.use(router.routes());

export default app;
