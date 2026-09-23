DROP POLICY "Visible posts are public" ON public.posts;
CREATE POLICY "Visitors see visible posts" ON public.posts FOR SELECT TO anon USING (NOT hidden);
CREATE POLICY "Members see visible or own posts" ON public.posts FOR SELECT TO authenticated USING (NOT hidden OR author_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
DROP POLICY "Visible comments are public" ON public.post_comments;
CREATE POLICY "Visitors see visible comments" ON public.post_comments FOR SELECT TO anon USING (NOT hidden);
CREATE POLICY "Members see visible or own comments" ON public.post_comments FOR SELECT TO authenticated USING (NOT hidden OR author_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));