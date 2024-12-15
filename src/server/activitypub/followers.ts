import * as Router from '@koa/router';
import config from '../../config';
import $ from 'cafy';
import ID, { transform } from '../../misc/cafy-id';
import { ILocalUser } from '../../models/user';
import Following from '../../models/following';
import * as url from '../../prelude/url';
import { renderActivity } from '../../remote/activitypub/renderer';
import renderOrderedCollection from '../../remote/activitypub/renderer/ordered-collection';
import renderOrderedCollectionPage from '../../remote/activitypub/renderer/ordered-collection-page';
import renderFollowUser from '../../remote/activitypub/renderer/follow-user';
import { setResponseType } from '../activitypub';

export default async (ctx: Router.RouterContext, user: ILocalUser) => {
	// Get 'cursor' parameter
	const [cursor, cursorErr] = $.optional.type(ID).get(ctx.request.query.cursor);

	// Get 'page' parameter
	const pageErr = !$.optional.str.or(['true', 'false']).ok(ctx.request.query.page);
	const page: boolean = ctx.request.query.page === 'true';

	// Validate parameters
	if (cursorErr || pageErr) {
		ctx.status = 400;
		ctx.set('Cache-Control', 'public, max-age=180');
		return;
	}

	if (user.hideFollows === 'always' || user.hideFollows === 'follower') {
		ctx.status = 403;
		ctx.set('Cache-Control', 'public, max-age=180');
		return;
	}

	const limit = 10;
	const partOf = `${config.url}/users/${user._id}/followers`;

	if (page) {
		const query = {
			followeeId: user._id
		} as any;

		// カーソルが指定されている場合
		if (cursor) {
			query._id = {
				$lt: transform(cursor)
			};
		}

		// Get followers
		const followings = user.hideFollows ? [] : await Following
			.find(query, {
				limit: limit + 1,
				sort: { _id: -1 }
			});

		// 「次のページ」があるかどうか
		const inStock = followings.length === limit + 1;
		if (inStock) followings.pop();

		const renderedFollowers = await Promise.all(followings.map(following => renderFollowUser(following.followerId)));
		const rendered = renderOrderedCollectionPage(
			`${partOf}?${url.query({
				page: 'true',
				cursor
			})}`,
			user.followersCount, renderedFollowers, partOf,
			null,
			inStock ? `${partOf}?${url.query({
				page: 'true',
				cursor: followings[followings.length - 1]._id.toHexString()
			})}` : null
		);

		ctx.body = renderActivity(rendered);
		setResponseType(ctx);
	} else {
		// index page
		const rendered = renderOrderedCollection(partOf, user.followersCount, user.hideFollows ? null : `${partOf}?page=true`, null);
		ctx.body = renderActivity(rendered);
		ctx.set('Cache-Control', 'public, max-age=180');
		setResponseType(ctx);
	}
};
