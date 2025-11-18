import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@my-better-t-app/auth";
import LetterDetail from "./letter-detail";

export default async function LetterDetailPage({
	params,
}: {
	params: { id: string };
}) {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session?.user) {
		redirect("/login");
	}

	return <LetterDetail letterId={params.id} session={session} />;
}

