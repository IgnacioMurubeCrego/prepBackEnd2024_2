import { ClientSession, Collection, ObjectId } from "mongodb";
import { APIvalidatephone, ContactModel, APIworldtime } from "./types.ts";
import { GraphQLError } from "graphql";

type Context = {
	ContactCollection: Collection<ContactModel>;
};

type QueryGetContactArgs = {
	id: string;
};

type MutationAddContactArgs = {
	name: string;
	phone: string;
};

type MutationDeleteContactArgs = {
	id: string;
};

type MutationUpdateContactArgs = {
	id: string;
	name: string;
	phone?: string;
};

export const resolvers = {
	Contact: {
		id: (parent: ContactModel) => {
			return parent._id?.toString();
		},
		datetime: async (parent: ContactModel): Promise<string> => {
			const timezone = parent.timezone;
			const API_KEY = Deno.env.get("API_KEY");
			if (!API_KEY) throw new GraphQLError("API_KEY needed to validate phone through API Ninjas");
			const url = "https://api.api-ninjas.com/v1/worldtime?timezone=" + timezone;

			// Get current time from API
			const timeData = await fetch(url, {
				headers: {
					"X-Api-Key": API_KEY,
				},
			});

			if (timeData.status !== 200) throw new GraphQLError("API Ninja Validate Phone Error");

			const response: APIworldtime = await timeData.json();
			return response.datetime;
		},
	},
	Query: {
		getContacts: async (_parent: unknown, _args: unknown, ctx: Context): Promise<ContactModel[]> => {
			return ctx.ContactCollection.find().toArray();
		},
		getContact: async (_parent: unknown, args: QueryGetContactArgs, ctx: Context): Promise<ContactModel | null> => {
			return ctx.ContactCollection.findOne({ _id: new ObjectId(args.id) });
		},
	},
	Mutation: {
		addContact: async (_parent: unknown, args: MutationAddContactArgs, ctx: Context): Promise<ContactModel> => {
			const { name, phone } = args;

			const phoneExists = await ctx.ContactCollection.countDocuments({ phone });
			if (phoneExists !== 0) throw new GraphQLError("Phone already exists in DB");

			const API_KEY = Deno.env.get("API_KEY");
			if (!API_KEY) throw new GraphQLError("API_KEY needed to validate phone through API Ninjas");
			const url = "https://api.api-ninjas.com/v1/validatephone?number=" + phone;

			// Validate Phone
			const valPhoneData = await fetch(url, {
				headers: {
					"X-Api-Key": API_KEY,
				},
			});

			if (valPhoneData.status !== 200) throw new GraphQLError("API Ninja Validate Phone Error");

			const response: APIvalidatephone = await valPhoneData.json();

			if (!response.is_valid) throw new GraphQLError("Phone is not valid");
			const country = response.country;
			const timezone = response.timezones[0];

			const contact = await ctx.ContactCollection.insertOne({
				name,
				phone,
				country,
				timezone,
			});

			return {
				_id: contact.insertedId,
				name,
				phone,
				country,
				timezone,
			};
		},
		deleteContact: async (_parent: unknown, args: MutationDeleteContactArgs, ctx: Context): Promise<boolean> => {
			const contactExists = await ctx.ContactCollection.countDocuments({ _id: new ObjectId(args.id) });
			if (contactExists === 0) throw new GraphQLError("Contact does not exist in DB");

			const { deletedCount } = await ctx.ContactCollection.deleteOne({ _id: new ObjectId(args.id) });

			if (deletedCount === 0) return false;
			else return true;
		},
		updateContact: async (_parent: unknown, args: MutationUpdateContactArgs, ctx: Context): Promise<ContactModel> => {
			const { id, name, phone } = args;

			if (!phone) {
				const newContact = await ctx.ContactCollection.findOneAndUpdate({ _id: new ObjectId(id) }, { $set: { name } });
				if (!newContact) throw new GraphQLError("Contact does not exist in DB");
				return newContact;
			}

			const phoneExists = await ctx.ContactCollection.countDocuments({ phone });
			if (phoneExists !== 0) throw new GraphQLError("Phone already exists in DB");

			const API_KEY = Deno.env.get("API_KEY");
			if (!API_KEY) throw new GraphQLError("API_KEY needed to validate phone through API Ninjas");
			const url = "https://api.api-ninjas.com/v1/validatephone?number=" + phone;

			// Validate Phone
			const valPhoneData = await fetch(url, {
				headers: {
					"X-Api-Key": API_KEY,
				},
			});

			if (valPhoneData.status !== 200) throw new GraphQLError("API Ninja Validate Phone Error");

			const response: APIvalidatephone = await valPhoneData.json();

			if (!response.is_valid) throw new GraphQLError("Phone is not valid");
			const country = response.country;
			const timezone = response.timezones[0];

			const newContact = await ctx.ContactCollection.findOneAndUpdate(
				{ _id: new ObjectId(id) },
				{ $set: { name, phone, country, timezone } }
			);
			if (!newContact) throw new GraphQLError("Contact does not exist in DB");
			return newContact;
		},
	},
};
