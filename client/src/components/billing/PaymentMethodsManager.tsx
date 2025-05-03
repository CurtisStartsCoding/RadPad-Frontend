import { useState } from "react";
import { 
  Card, 
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle 
} from "@/components/ui/card";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, CreditCard, Edit, PlusCircle, Trash2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Mock data for payment methods
interface PaymentMethod {
  id: string;
  type: 'credit_card' | 'bank_account';
  last4: string;
  brand?: string;
  expMonth?: number;
  expYear?: number;
  bankName?: string;
  accountType?: string;
  isDefault: boolean;
}

const mockPaymentMethods: PaymentMethod[] = [
  {
    id: 'pm_1',
    type: 'credit_card',
    brand: 'visa',
    last4: '4242',
    expMonth: 12,
    expYear: 2025,
    isDefault: true
  },
  {
    id: 'pm_2',
    type: 'credit_card',
    brand: 'mastercard',
    last4: '5555',
    expMonth: 8,
    expYear: 2026,
    isDefault: false
  },
  {
    id: 'pm_3',
    type: 'bank_account',
    last4: '6789',
    bankName: 'Chase',
    accountType: 'checking',
    isDefault: false
  }
];

// Credit card brand icons (simplified with emojis for the mockup)
const cardBrandIcon = (brand?: string) => {
  switch (brand?.toLowerCase()) {
    case 'visa':
      return "💳 Visa";
    case 'mastercard':
      return "💳 Mastercard";
    case 'amex':
      return "💳 American Express";
    case 'discover':
      return "💳 Discover";
    default:
      return "💳 Card";
  }
};

export function PaymentMethodsManager() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(mockPaymentMethods);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [currentMethod, setCurrentMethod] = useState<PaymentMethod | null>(null);
  
  // New payment method form state
  const [newCardNumber, setNewCardNumber] = useState('');
  const [newCardName, setNewCardName] = useState('');
  const [newCardExpiry, setNewCardExpiry] = useState('');
  const [newCardCvc, setNewCardCvc] = useState('');
  const [newMethodType, setNewMethodType] = useState<'credit_card' | 'bank_account'>('credit_card');

  // This would actually use the Stripe Elements or similar in a real implementation
  const handleAddPaymentMethod = () => {
    // Simulate adding a new payment method (in reality would use Stripe)
    const newMethod: PaymentMethod = {
      id: `pm_${Math.random().toString(36).substring(2, 11)}`,
      type: newMethodType,
      last4: newCardNumber.slice(-4) || '0000',
      brand: 'visa', // Would come from Stripe in real implementation
      expMonth: parseInt(newCardExpiry.split('/')[0]) || 12,
      expYear: parseInt(`20${newCardExpiry.split('/')[1]}`) || 2030,
      isDefault: paymentMethods.length === 0 // Make default if it's the first one
    };
    
    setPaymentMethods([...paymentMethods, newMethod]);
    
    // Reset form
    setNewCardNumber('');
    setNewCardName('');
    setNewCardExpiry('');
    setNewCardCvc('');
    setShowAddDialog(false);
  };

  const handleDeletePaymentMethod = () => {
    if (!currentMethod) return;
    
    // If deleting the default method, make another one default
    let newMethods = paymentMethods.filter(method => method.id !== currentMethod.id);
    
    if (currentMethod.isDefault && newMethods.length > 0) {
      newMethods[0].isDefault = true;
    }
    
    setPaymentMethods(newMethods);
    setShowDeleteDialog(false);
  };

  const handleSetDefaultPaymentMethod = (methodId: string) => {
    setPaymentMethods(
      paymentMethods.map(method => ({
        ...method,
        isDefault: method.id === methodId
      }))
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Payment Methods</h2>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button variant="default">
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Payment Method
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>Add Payment Method</DialogTitle>
              <DialogDescription>
                Add a new payment method to your organization account.
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4">
              <div className="mb-4">
                <Select value={newMethodType} onValueChange={(value: any) => setNewMethodType(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="credit_card">Credit or Debit Card</SelectItem>
                    <SelectItem value="bank_account">Bank Account</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {newMethodType === 'credit_card' ? (
                <div className="space-y-4">
                  <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="cardNumber">Card number</Label>
                    <Input 
                      id="cardNumber" 
                      type="text" 
                      placeholder="•••• •••• •••• ••••" 
                      value={newCardNumber}
                      onChange={(e) => setNewCardNumber(e.target.value)}
                    />
                  </div>
                  
                  <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="cardName">Name on card</Label>
                    <Input 
                      id="cardName" 
                      type="text" 
                      placeholder="John Smith" 
                      value={newCardName}
                      onChange={(e) => setNewCardName(e.target.value)}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid w-full items-center gap-1.5">
                      <Label htmlFor="expiry">Expiry date</Label>
                      <Input 
                        id="expiry" 
                        type="text" 
                        placeholder="MM/YY" 
                        value={newCardExpiry}
                        onChange={(e) => setNewCardExpiry(e.target.value)}
                      />
                    </div>
                    
                    <div className="grid w-full items-center gap-1.5">
                      <Label htmlFor="cvc">CVC</Label>
                      <Input 
                        id="cvc" 
                        type="text" 
                        placeholder="•••" 
                        value={newCardCvc}
                        onChange={(e) => setNewCardCvc(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Bank account setup</AlertTitle>
                    <AlertDescription>
                      Bank account setup requires additional verification. You'll be redirected to a secure form in the next step.
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
              <Button onClick={handleAddPaymentMethod}>Save Payment Method</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      {paymentMethods.length === 0 ? (
        <Card>
          <CardContent className="p-8">
            <div className="flex flex-col items-center justify-center text-center space-y-3">
              <CreditCard className="h-8 w-8 text-slate-400" />
              <div>
                <h3 className="font-semibold">No payment methods</h3>
                <p className="text-sm text-slate-500">Add a payment method to manage your subscription and purchase credits.</p>
              </div>
              <Button 
                variant="outline" 
                onClick={() => setShowAddDialog(true)}
                className="mt-2"
              >
                Add Payment Method
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {paymentMethods.map((method) => (
            <Card key={method.id} className={method.isDefault ? "border-primary" : ""}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-base">
                      {method.type === 'credit_card' 
                        ? cardBrandIcon(method.brand) 
                        : "🏦 Bank Account"}
                    </CardTitle>
                    <CardDescription>
                      {method.type === 'credit_card' 
                        ? `•••• •••• •••• ${method.last4}` 
                        : `${method.bankName} •••• ${method.last4}`}
                    </CardDescription>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => {
                      setCurrentMethod(method);
                      setShowEditDialog(true);
                    }}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => {
                      setCurrentMethod(method);
                      setShowDeleteDialog(true);
                    }}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pb-2">
                {method.type === 'credit_card' && (
                  <div className="text-sm">Expires {method.expMonth}/{method.expYear}</div>
                )}
                {method.type === 'bank_account' && (
                  <div className="text-sm">{method.accountType} account</div>
                )}
              </CardContent>
              <CardFooter>
                {method.isDefault ? (
                  <div className="text-sm text-primary font-medium">Default payment method</div>
                ) : (
                  <Button 
                    variant="link" 
                    size="sm" 
                    className="h-auto p-0" 
                    onClick={() => handleSetDefaultPaymentMethod(method.id)}
                  >
                    Set as default
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
      
      {/* Edit Payment Method Dialog - In a real app, would use Stripe Elements */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Payment Method</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Limited editing</AlertTitle>
              <AlertDescription>
                For security reasons, editing payment methods is limited. To update card details, please add a new payment method and remove the old one.
              </AlertDescription>
            </Alert>
            {currentMethod?.type === 'credit_card' && (
              <div className="mt-4 space-y-4">
                <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor="updateCardName">Name on card</Label>
                  <Input id="updateCardName" type="text" defaultValue="John Smith" />
                </div>
                
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="makeDefault" defaultChecked={currentMethod.isDefault} />
                  <Label htmlFor="makeDefault">Make default payment method</Label>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button>
            <Button onClick={() => setShowEditDialog(false)}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Payment Method Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Payment Method</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Are you sure you want to remove this payment method?</p>
            {currentMethod?.isDefault && (
              <Alert className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Default payment method</AlertTitle>
                <AlertDescription>
                  This is your default payment method. If removed, another payment method will be set as default.
                </AlertDescription>
              </Alert>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeletePaymentMethod}>Remove</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}