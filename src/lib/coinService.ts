import { supabase } from "@/lib/supabase"

export const VIDEO_REWARD_COINS = 10

export async function getCurrentUserId() {
  const { data: sessionData, error } = await supabase.auth.getSession()

  if (error || !sessionData.session?.user) {
    throw new Error("User not logged in")
  }

  return sessionData.session.user.id
}

export async function getUserCoins() {
  const userId = await getCurrentUserId()

  const { data, error } = await supabase
    .from("profiles")
    .select("coins")
    .eq("user_id", userId)
    .maybeSingle()

  if (error) {
    throw error
  }

  return data?.coins ?? 0
}

export async function hasVideoReward(videoId: string) {
  const userId = await getCurrentUserId()

  const { data, error } = await supabase
    .from("education_video_rewards")
    .select("id")
    .eq("user_id", userId)
    .eq("video_id", videoId)
    .maybeSingle()

  if (error) {
    throw error
  }

  return !!data
}

export async function rewardUserForVideo(videoId: string) {
  const userId = await getCurrentUserId()

  const alreadyRewarded = await hasVideoReward(videoId)

  if (alreadyRewarded) {
    return {
      success: false,
      message: "Coins already claimed for this video.",
    }
  }

  const currentCoins = await getUserCoins()
  const newCoins = currentCoins + VIDEO_REWARD_COINS

  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      coins: newCoins,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)

  if (updateError) {
    throw updateError
  }

  const { error: insertError } = await supabase
    .from("education_video_rewards")
    .insert({
      user_id: userId,
      video_id: videoId,
      coins_awarded: VIDEO_REWARD_COINS,
    })

  if (insertError) {
    throw insertError
  }

  return {
    success: true,
    message: `You earned ${VIDEO_REWARD_COINS} coins!`,
    coins: newCoins,
  }
}