import { createClient } from "@/utils/auth-helpers/client";

export async function uploadImage(image: File) {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getSession();
  const user = userData.session?.user;

  if (!user) {
    throw new Error("User not authenticated");
  }

  const fileName = `${user.id}/-${image.name}`;
  const { data, error: uploadError } = await supabase.storage
    .from("uploads")
    .upload(fileName, image);

  if (uploadError) {
    return {
      url: null,
      error: {
        bucketError: uploadError,
      },
    };
  }

  const path = data?.path;
  const { data: PublicUrl } = supabase.storage
    .from("uploads")
    .getPublicUrl(path as string);

  if (PublicUrl?.publicUrl) {
    return {
      url: PublicUrl.publicUrl,
      error: null,
    };
  } else {
    return {
      url: null,
      error: {
        bucketError: null,
        publicUrlError: new Error("Failed to retrieve public URL"),
      },
    };
  }
}
