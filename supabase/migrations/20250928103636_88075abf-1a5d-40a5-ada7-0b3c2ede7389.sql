-- Add language field to education table for multilingual support
ALTER TABLE public.education 
ADD COLUMN language text NOT NULL DEFAULT 'en';

-- Add index for better performance when filtering by language
CREATE INDEX idx_education_language ON public.education(language);

-- Add sample multilingual education content
INSERT INTO public.education (title, content, category, target_role, language, priority, image_url) VALUES
-- English content
('Safe Drinking Water Practices', 'Always boil water for at least 1 minute before drinking. Store boiled water in clean, covered containers. Avoid drinking from unknown sources.', 'water_safety', 'community', 'en', 1, null),
('Handwashing Techniques', 'Wash hands with soap for at least 20 seconds. Clean under fingernails and between fingers. Use clean water and dry with a clean towel.', 'hygiene', 'community', 'en', 2, null),
('Preventing Diarrhea', 'Eat freshly cooked food while hot. Avoid raw vegetables and fruits you cannot peel. Practice good hygiene and sanitation.', 'health_awareness', 'community', 'en', 3, null),
('Recognizing Waterborne Symptoms', 'Watch for symptoms like diarrhea, vomiting, stomach cramps, and fever. Seek immediate medical attention if symptoms persist.', 'health_awareness', 'community', 'en', 4, null),

-- Hindi content
('सुरक्षित पेयजल प्रथाएं', 'पीने से पहले पानी को कम से कम 1 मिनट तक उबालें। उबले हुए पानी को साफ, ढके हुए बर्तनों में रखें। अज्ञात स्रोतों से पानी पीने से बचें।', 'water_safety', 'community', 'hi', 1, null),
('हाथ धोने की तकनीक', 'कम से कम 20 सेकंड तक साबुन से हाथ धोएं। नाखूनों के नीचे और उंगलियों के बीच सफाई करें। साफ पानी का उपयोग करें और साफ तौलिये से सुखाएं।', 'hygiene', 'community', 'hi', 2, null),
('दस्त की रोकथाम', 'ताजा पका हुआ गर्म खाना खाएं। कच्ची सब्जियों और फलों से बचें जिन्हें आप छील नहीं सकते। अच्छी स्वच्छता और सफाई का अभ्यास करें।', 'health_awareness', 'community', 'hi', 3, null),

-- Assamese content  
('সুৰক্ষিত পানীয় জলৰ অভ্যাস', 'খোৱাৰ আগতে পানী কমেও ১ মিনিট উতলাওক। উতলোৱা পানী পৰিষ্কাৰ, ঢাকনি থকা পাত্ৰত ৰাখক। অজ্ঞাত উৎসৰ পৰা পানী খোৱা পৰিহাৰ কৰক।', 'water_safety', 'community', 'as', 1, null),
('হাত ধোৱাৰ কৌশল', 'কমেও ২০ ছেকেণ্ডৰ বাবে চাবোনেৰে হাত ধুওক। নখৰ তলত আৰু আঙুলিৰ মাজত পৰিষ্কাৰ কৰক। পৰিষ্কাৰ পানী ব্যৱহাৰ কৰক আৰু পৰিষ্কাৰ টাৱেলেৰে শুকুৱাওক।', 'hygiene', 'community', 'as', 2, null),

-- Bodo content (sample)
('गावगाव दावगारि नुं आन्दो', 'नुं नाङा सिगाङै १ मिनिट हाबै उफुनगों। उफुन्नि नुंखौ गाजाब, खावगारि फुदुरिफोरै थै। मावगारि सोरनिफ्राइ नुं नङै नैअंग खामगिर।', 'water_safety', 'community', 'bodo', 1, null),
('लाखाइ दुबगारि फेन', 'साबुन जोबने २० सेकेण्ड हाबै लाखाइ दुब। लाखाइ निफोंजाव आरो लाखाइस्रेवै गाजाब खालाम। गाजाब नुं लागैगौ गाजाब तुलिजा लुं गैया।', 'hygiene', 'community', 'bodo', 2, null);

-- Enable RLS for real-time subscriptions  
ALTER TABLE public.education REPLICA IDENTITY FULL;