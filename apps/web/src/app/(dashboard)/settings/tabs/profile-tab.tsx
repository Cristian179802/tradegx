"use client";

import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { profileSchema, type ProfileInput } from "@/lib/validations";

export function ProfileTab({ initialName }: { initialName: string }) {
  const t = useTranslations("settings.profile");
  const { data: session, update } = useSession();
  const { toast } = useToast();

  const form = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: initialName || session?.user?.name || "",
      language: "RO",
      currency: "USD",
      theme: "DARK",
      timezone: "Europe/Bucharest",
    },
  });

  const isLoading = form.formState.isSubmitting;

  async function onSubmit(data: ProfileInput) {
    const res = await fetch("/api/user/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      toast({ title: t("errTitle"), description: t("errDesc"), variant: "destructive" });
      return;
    }

    await update({ name: data.name });
    toast({ title: t("savedTitle"), description: t("savedDesc") });
  }

  return (
    <Card className="bg-zinc-900/80 border-zinc-800/80 rounded-2xl">
      <CardHeader>
        <CardTitle className="text-zinc-100 text-base">{t("cardTitle")}</CardTitle>
        <CardDescription className="text-zinc-500">
          {t("cardDesc")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-zinc-300">{t("name")}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      className="bg-zinc-900 border-zinc-700 text-white focus:border-indigo-500"
                    />
                  </FormControl>
                  <FormMessage className="text-rose-400" />
                </FormItem>
              )}
            />

            <div className="space-y-1.5">
              <label className="text-sm text-zinc-300">{t("email")}</label>
              <Input
                value={session?.user?.email ?? ""}
                disabled
                className="bg-zinc-950 border-zinc-800 text-zinc-500 cursor-not-allowed"
              />
              <p className="text-xs text-zinc-600">{t("emailNote")}</p>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-500/20 gap-1.5"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {t("save")}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
