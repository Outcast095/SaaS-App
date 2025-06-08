"use server";

import { supabase } from "../supabase";
import { configureAssistant } from "../utils";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// Define the type for the companion data
export type CompanionFormData = {
  name: string;
  subject: string;
  topic: string;
  voice: string;
  style: string;
  duration: number;
};

/**
 * Creates a new companion in the database
 * @param data The companion data from the form
 * @returns The created companion
 */
export const createCompanion = async (data: CompanionFormData) => {
  try {
    // Configure the assistant based on voice and style
    const assistantConfig = configureAssistant(data.voice, data.style);
    
    // Insert the companion data into the database
    const { data: companion, error } = await supabase
      .from('companions')
      .insert({
        name: data.name,
        subject: data.subject,
        topic: data.topic,
        voice: data.voice,
        style: data.style,
        duration: data.duration,
        assistant_config: assistantConfig,
        // Add any other fields as needed
      })
      .select()
      .single();
    
    if (error) {
      console.error("Error creating companion:", error);
      throw new Error(`Failed to create companion: ${error.message}`);
    }
    
    // Revalidate the companions page to show the new companion
    revalidatePath('/companions');
    
    return companion;
  } catch (error) {
    console.error("Error in createCompanion:", error);
    throw error;
  }
};