import * as Router from '@koa/router';
import config from '../../config';
import $ from 'cafy';
import ID, { transform } from '../../misc/cafy-id';
import { ILocalUser } from '../../models/user';
import { renderActivity } from '../../remote/activitypub/renderer';
import renderOrderedCollection from '../../remote/activitypub/renderer/ordered-collection';
import renderOrderedCollectionPage from '../../remote/activitypub/renderer/ordered-collection-page';
import { setResponseType } from '../activitypub';

import Note, { INote } from '../../models/note';
import renderNote from '../../remote/activitypub/renderer/note';
import renderCreate from '../../remote/activitypub/renderer/create';
import renderAnnounce from '../../remote/activitypub/renderer/announce';
import { countIf } from '../../prelude/array';
import * as url from '../../prelude/url';

export default async (ctx: Router.RouterContext, user: ILocalUser) => {
	// Get 'sinceId' parameter
	const [sinceId, sinceIdErr] = $.optional.type(ID).get(ctx.request.query.since_id);

	// Get 'untilId' parameter
	const [untilId, untilIdErr] = $.optional.type(ID).get(ctx.request.query.until_id);

	// Get 'page' parameter
	const pageErr = !$.optional.str.or(['true', 'false']).ok(ctx.request.query.page);
	const page: boolean = ctx.request.query.page === 'true';

	// Validate parameters
	if (sinceIdErr || untilIdErr || pageErr || countIf(x => x != null, [sinceId, untilId]) > 1) {
		ctx.status = 400;
		ctx.set('Cache-Control', 'public, max-age=180');
		return;
	}

	const limit = 20;
	const partOf = `${config.url}/users/${user._id}/outbox`;

	if (page) {
		//#region Construct query
		const sort = {
			_id: -1
		};

		const query = {
			userId: user._id,
			visibility: { $in: ['public', 'home'] },
			localOnly: { $ne: true },
			copyOnce: { $ne: true }
		} as any;

		if (sinceId) {
			sort._id = 1;
			query._id = {
				$gt: transform(sinceId)
			};
		} else if (untilId) {
			query._id = {
				$lt: transform(untilId)
			};
		}
		//#endregion

		const notes = await Note
			.find(query, {
				limit: limit,
				sort: sort
			});

		if (sinceId) notes.reverse();

		const activities = await Promise.all(notes.map(note => packActivity(note)));
		const rendered = renderOrderedCollectionPage(
			`${partOf}?${url.query({
				page: 'true',
				since_id: sinceId,
				until_id: untilId
			})}`,
			user.notesCount, activities, partOf,
			notes.length ? `${partOf}?${url.query({
				page: 'true',
				since_id: notes[0]._id.toHexString()
			})}` : null,
			notes.length ? `${partOf}?${url.query({
				page: 'true',
				until_id: notes[notes.length - 1]._id.toHexString()
			})}` : null
		);

		ctx.body = renderActivity(rendered);
		setResponseType(ctx);
	} else {
		// index page
		const rendered = renderOrderedCollection(partOf, user.notesCount,
			`${partOf}?page=true`,
			`${partOf}?page=true&since_id=000000000000000000000000`
		);
		ctx.body = renderActivity(rendered);
		ctx.set('Cache-Control', 'public, max-age=180');
		setResponseType(ctx);
	}
};

/**
 * Pack Create<Note> or Announce Activity
 * @param note Note
 */
export async function packActivity(note: INote): Promise<object | null> {
	if (note.renoteId && note.text == null && note.poll == null && (note.fileIds == null || note.fileIds.length == 0)) {
		const renote = await Note.findOne(note.renoteId);
		if (!renote) throw new Error(`Note(${note._id}) の 対象Renote(${note.renoteId})が存在しない。DB壊れている？`);
		return renderAnnounce(renote.uri ? renote.uri : `${config.url}/notes/${renote._id}`, note);
	}

	return renderCreate(await renderNote(note, false), note);
}
