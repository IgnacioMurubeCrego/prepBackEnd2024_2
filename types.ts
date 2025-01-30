import { OptionalId, ObjectId } from "mongodb";

export type ContactModel = OptionalId<{
	name: string;
	phone: string;
	country: string;
	timezone: string;
}>;

//https://api.api-ninjas.com/v1/validatephone?number=+12065550100
export type APIvalidatephone = {
	is_valid: boolean;
	country: string;
	timezones: string[];
};

//https://api.api-ninjas.com/v1/worldtime?city=london
export type APIworldtime = {
	datetime: string;
};
