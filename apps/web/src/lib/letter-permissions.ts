export type UserRole =
	| "መሪ ስራ አስፈፃሚ"
	| "ዴስክ ሃላፊ"
	| "ኤክስፐርት"
	| "ፀሐፊ"
	| "መዝገብ ክፍል";

export function getLetterPermissions(role: string | null | undefined) {
	if (!role) {
		return {
			canEditDraft: false,
			canApprove: false,
			canStamp: false,
			canAssignTask: false,
			canScanIncoming: false,
			canComment: false,
		};
	}

	return {
		canEditDraft: role === "ፀሐፊ" || role === "መሪ ስራ አስፈፃሚ",
		canApprove: role === "መሪ ስራ አስፈፃሚ",
		canStamp: role === "መዝገብ ክፍል",
		canAssignTask: role !== "ፀሐፊ", // all except secretary
		canScanIncoming: role === "ፀሐፊ" || role === "መዝገብ ክፍል",
		canComment: true, // everyone
	};
}

