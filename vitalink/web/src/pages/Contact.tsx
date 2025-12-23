import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ExternalLink, MessageSquare, Phone, Info, Mail } from "lucide-react"

export default function Contact() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold text-foreground mb-6">Help & Support</h1>
        
        <div className="grid gap-6">
            {/* About Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Info className="w-5 h-5 text-primary" />
                        About MyHFGuard
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">
                        MyHFGuard is your comprehensive companion for managing heart failure. 
                        We aim to empower patients with tools for self-monitoring, medication reminders, 
                        and educational resources to improve quality of life.
                    </p>
                </CardContent>
            </Card>

            {/* FAQ Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-primary" />
                        Frequently Asked Questions
                    </CardTitle>
                    <CardDescription>
                        Find answers to common questions about heart failure and app usage.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="mb-4 text-sm text-muted-foreground">
                        For comprehensive medical FAQs, we recommend the resources provided by Heart Failure Matters.
                    </p>
                    <Button variant="outline" className="w-full justify-between" asChild>
                        <a href="https://www.heartfailurematters.org/faq/frequently-asked-questions/" target="_blank" rel="noopener noreferrer">
                            Visit Heart Failure Matters FAQ
                            <ExternalLink className="w-4 h-4 ml-2" />
                        </a>
                    </Button>
                </CardContent>
            </Card>

            {/* Contact Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Phone className="w-5 h-5 text-primary" />
                        Get in Touch
                    </CardTitle>
                    <CardDescription>
                        Need assistance? We are here to help.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="flex items-start gap-4 p-4 border rounded-lg bg-muted/30">
                        <Phone className="w-5 h-5 text-primary mt-1" />
                        <div>
                            <h3 className="font-semibold">Medical Emergency</h3>
                            <p className="text-sm text-muted-foreground">
                                If you are experiencing a medical emergency, please call your local emergency number immediately. 
                                Do not rely on this app for urgent care.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-4 p-4 border rounded-lg bg-muted/30">
                        <Mail className="w-5 h-5 text-primary mt-1" />
                        <div>
                            <h3 className="font-semibold">App Support</h3>
                            <p className="text-sm text-muted-foreground">
                                For technical issues or feedback about the application, please contact your healthcare provider or administrator.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  )
}