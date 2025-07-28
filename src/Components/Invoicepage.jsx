import React, { useState, useEffect, useRef } from 'react';
import {
    Box,
    Paper,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Button,
    CircularProgress,
    Container,
    useMediaQuery,
    useTheme
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import Footer from '../Footer';
import Header from '../Header';
import baseurl from '../baseurl/ApiService';
import { useAuth } from '../App';
import velaanLogo from '../assets/velaanLogo.png';

function InvoicesPage() {
    const { id: orderId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const [orderDetails, setOrderDetails] = useState(null);
    const [orderItems, setOrderItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const pdfRef = useRef();
    const [exportMode, setExportMode] = useState(false);

    const borderStyle = '1px solid #000';
    const noBorderStyle = 'none';
    const cellStyle = {
        padding: isMobile ? '2px 4px' : '4px 8px',
        borderLeft: borderStyle,
        borderRight: noBorderStyle,
        borderTop: noBorderStyle,
        borderBottom: noBorderStyle,
        fontSize: isMobile ? '12px' : '14px'
    };
    const headerCellStyle = {
        ...cellStyle,
        fontWeight: 'bold'
    };
    const rightAlignedCell = {
        ...cellStyle,
        textAlign: 'right'
    };

    const invoiceData = {
        companyName: "VELAAN MART AGRITECH PRIVATE LIMITED",
        companyAddress: [
            "Velaan Mart, FORUM - TABIF",
            "Navalurkkottapattu",
            "Trichy Tamil Nadu 620027",
            "India",
            "GSTIN 33AAKCV5016C1ZO"
        ],
        invoiceNumber: "INV-000144",
        invoiceDate: "13/05/2025",
        terms: "Due on Receipt",
        dueDate: "13/05/2025",
        poNumber: "SO-00809",
        placeOfSupply: "Tamil Nadu (33)",
        supplierGSTIN: "33AAKCV5016C1ZO",
        contact: "9715129387",
        billTo: {
            name: "The Nodal Officer, Agricultural College And Research Institute, Chettinad",
            address: [
                "Chettinad",
                "Kanadukathan",
                "Sivagangai",
                "630 103 Tamil Nadu",
                "India"
            ]
        },
        shipTo: {
            address: [
                "Chettinad",
                "Kanadukathan",
                "Sivagangai",
                "630 103 Tamil Nadu",
                "India"
            ]
        }
    };

    useEffect(() => {
        if (!orderId) {
            navigate('/invoice');
            return;
        }

        const fetchOrderDetails = async () => {
            try {
                const res = await fetch(`${baseurl}/api/order/${orderId}`);
                const data = await res.json();
                setOrderDetails(data.data);
            } catch (err) {
                console.error('Error loading order details:', err);
            }
        };

        const fetchOrderItems = async () => {
            try {
                const res = await fetch(`${baseurl}/api/order-items/all`);
                const data = await res.json();
                const filteredItems = data.data.filter(
                    (item) => item.order_id === Number(orderId)
                );
                setOrderItems(filteredItems);
            } catch (err) {
                console.error('Error loading order items:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchOrderDetails();
        fetchOrderItems();
    }, [orderId, navigate]);

    const exportToPDF = () => {
        setExportMode(true);
        setTimeout(() => {
            const input = pdfRef.current;
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();

            // Hide header and footer before capturing
            const header = document.querySelector('header');
            const footer = document.querySelector('footer');
            if (header) header.style.visibility = 'hidden';
            if (footer) footer.style.visibility = 'hidden';

            html2canvas(input, {
                scale: 2,
                useCORS: true,
                allowTaint: true,
                scrollY: -window.scrollY,
                width: 800,
                windowWidth: 800
            }).then((canvas) => {
                const imgData = canvas.toDataURL('image/png');
                const imgProps = pdf.getImageProperties(imgData);

                const imgWidth = pdfWidth;
                const imgHeight = (imgProps.height * imgWidth) / imgProps.width;

                let finalImgWidth = imgWidth;
                let finalImgHeight = imgHeight;

                if (imgHeight > pdfHeight) {
                    finalImgHeight = pdfHeight;
                    finalImgWidth = (imgProps.width * pdfHeight) / imgProps.height;
                }

                const x = (pdfWidth - finalImgWidth) / 2;
                const y = (pdfHeight - finalImgHeight) / 2;

                pdf.addImage(imgData, 'PNG', x, y, finalImgWidth, finalImgHeight);

                if (header) header.style.visibility = 'visible';
                if (footer) footer.style.visibility = 'visible';

                pdf.save(`invoice-${orderId}.pdf`);
                setExportMode(false);
            });
        }, 100);
    };

    // Number to words converter functions...
    const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const scales = ['', 'Thousand', 'Lakh', 'Crore'];

    function convertTwoDigit(num) {
        if (num < 10) return units[num];
        else if (num >= 10 && num < 20) return teens[num - 10];
        else {
            return tens[Math.floor(num / 10)] + (num % 10 !== 0 ? ' ' + units[num % 10] : '');
        }
    }

    const {
        order_id,
        order_date,
        delivery_date,
        CustomerProfile: {
            address = '',
            contact_person_email = '',
            contact_person_name
        } = {},
    } = orderDetails || {};

    function convertNumberToWords(num) {
        if (num === 0) return 'Zero';
        let result = '';
        let scaleIndex = 0;
        while (num > 0) {
            let chunk = num % 1000;
            let chunkWords = '';
            const hundreds = Math.floor(chunk / 100);
            const remainder = chunk % 100;
            if (hundreds) chunkWords += units[hundreds] + ' Hundred ';
            if (remainder) {
                chunkWords += convertTwoDigit(remainder) + ' ';
            }
            if (chunkWords) {
                result = chunkWords + scales[scaleIndex] + ' ' + result;
            }
            num = Math.floor(num / 1000);
            scaleIndex++;
        }
        return result.trim();
    }

    function amountInWords(amount) {
        const rupees = Math.floor(amount);
        const paise = Math.round((amount - rupees) * 100);
        let words = convertNumberToWords(rupees) + ' Rupees';
        if (paise > 0) {
            words += ' and ' + convertNumberToWords(paise) + ' Paise';
        }
        return words;
    }

    // Calculate order totals
    const subtotal = orderItems.reduce((sum, item) => {
        const lineTotal = parseFloat(item.line_total) || 0;
        return sum + lineTotal;
    }, 0);

    let cgstAmount = 0;
    let sgstAmount = 0;

    orderItems.forEach(item => {
        const cgstRate = item.Product?.cgst || 0;
        const sgstRate = item.Product?.sgst || 0;
        const lineTotal = parseFloat(item.line_total) || 0;
        cgstAmount += (lineTotal * cgstRate) / 100;
        sgstAmount += (lineTotal * sgstRate) / 100;
    });

    const totalDeliveryFee = orderItems.reduce(
        (acc, row) => acc + (Number(row.Product?.delivery_fee) || 0),
        0
    );

    const grandTotal = subtotal + cgstAmount + sgstAmount + totalDeliveryFee;

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ p: 3 }}>
                <Typography color="error">{error}</Typography>
            </Box>
        );
    }

    if (!orderDetails) {
        return (
            <Box sx={{ p: 3 }}>
                <Typography>No order details found.</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ pb: 8 }}>
            <Header />
            <Container maxWidth={false} sx={{ px: exportMode ? 0 : isMobile ? 1 : 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2, mt: 3 }}>
                    <Button
                        variant="contained"
                        onClick={exportToPDF}
                        sx={{ backgroundColor: '#10B981', '&:hover': { backgroundColor: '#0D9F6E' } }}
                        size={isMobile ? 'small' : 'medium'}
                    >
                        Export as PDF
                    </Button>
                </Box>

                {/* Invoice content to be exported to PDF */}
                <Box ref={pdfRef}>
                    <Paper sx={{
                        width: exportMode ? '800px' : '100%',
                        maxWidth: exportMode ? '800px' : '1200px',
                        margin: '20px auto',
                        border: borderStyle,
                        p: 0,
                        borderRadius: 0,
                        boxShadow: 'none',
                        overflowX: isMobile ? 'auto' : 'visible'
                    }}>
                        {/* Header - Company and Invoice Title */}
                        <Box sx={{
                            display: 'flex',
                            flexDirection: isMobile ? 'column' : 'row',
                            borderBottom: borderStyle
                        }}>
                            <Box sx={{
                                width: isMobile ? '100%' : '100px',
                                p: 1,
                                borderRight: isMobile ? noBorderStyle : borderStyle,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderBottom: isMobile ? borderStyle : noBorderStyle
                            }}>
                                <img src={velaanLogo} alt="Velaan Mart" style={{ maxWidth: '90px', height: 'auto' }} />
                            </Box>
                            <Box sx={{
                                flex: 1,
                                p: 1,
                                borderRight: isMobile ? noBorderStyle : borderStyle
                            }}>
                                <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: isMobile ? '16px' : '18px' }}>
                                    {invoiceData.companyName}
                                </Typography>
                                {invoiceData.companyAddress.map((line, index) => (
                                    <Typography key={index} variant="body2" sx={{ fontSize: isMobile ? '11px' : '12px' }}>
                                        {line}
                                    </Typography>
                                ))}
                            </Box>
                            <Box sx={{
                                width: isMobile ? '100%' : '250px',
                                p: 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <Typography variant="h4" sx={{ fontWeight: 'bold', fontSize: isMobile ? '24px' : '32px' }}>
                                    TAX INVOICE
                                </Typography>
                            </Box>
                        </Box>

                        {/* Invoice Details and Company Information */}
                        <Box sx={{
                            display: 'flex',
                            flexDirection: isMobile ? 'column' : 'row',
                            borderBottom: borderStyle
                        }}>
                            {/* Left Column - Invoice Details */}
                            <Box sx={{
                                width: isMobile ? '100%' : '50%',
                                borderRight: isMobile ? noBorderStyle : borderStyle,
                                borderBottom: isMobile ? borderStyle : noBorderStyle
                            }}>
                                <Table size="small" sx={{ tableLayout: 'fixed' }}>
                                    <TableBody>
                                        <TableRow>
                                            <TableCell sx={{ ...headerCellStyle, width: isMobile ? '30%' : '35%' }}>#</TableCell>
                                            <TableCell sx={cellStyle}>: {order_id}</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell sx={headerCellStyle}>Invoice Date</TableCell>
                                            <TableCell sx={cellStyle}>: {order_date}</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell sx={headerCellStyle}>Terms</TableCell>
                                            <TableCell sx={cellStyle}>: {invoiceData.terms}</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell sx={headerCellStyle}>Due Date</TableCell>
                                            <TableCell sx={cellStyle}>: {delivery_date}</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell sx={headerCellStyle}>P.O.#</TableCell>
                                            <TableCell sx={cellStyle}>: {invoiceData.poNumber}</TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </Box>

                            {/* Right Column - GSTIN etc. */}
                            <Box sx={{
                                width: isMobile ? '100%' : '50%'
                            }}>
                                <Table size="small" sx={{ tableLayout: 'fixed' }}>
                                    <TableBody>
                                        <TableRow>
                                            <TableCell sx={{ ...headerCellStyle, width: isMobile ? '40%' : '50%' }}>Place Of Supply</TableCell>
                                            <TableCell sx={cellStyle}>: {invoiceData.placeOfSupply}</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell sx={headerCellStyle}>GSTIN</TableCell>
                                            <TableCell sx={cellStyle}>: {invoiceData.supplierGSTIN}</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell sx={headerCellStyle}>Contact</TableCell>
                                            <TableCell sx={cellStyle}>: {invoiceData.contact}</TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </Box>
                        </Box>

                        {/* Bill To and Ship To */}
                        <Box sx={{
                            display: 'flex',
                            flexDirection: isMobile ? 'column' : 'row',
                            borderBottom: borderStyle
                        }}>
                            {/* Bill To */}
                            <Box sx={{
                                width: isMobile ? '100%' : '50%',
                                p: isMobile ? 1 : 2,
                                borderRight: isMobile ? noBorderStyle : borderStyle,
                                borderBottom: isMobile ? borderStyle : noBorderStyle
                            }}>
                                <Typography sx={{ fontWeight: 'bold', fontSize: isMobile ? '13px' : '14px', mb: 1 }}>Bill To</Typography>
                                <Typography sx={{ fontWeight: 'bold', fontSize: isMobile ? '13px' : '14px' }}>{invoiceData.billTo.name}</Typography>
                                {invoiceData.billTo.address.map((line, index) => (
                                    <Typography key={index} sx={{ fontSize: isMobile ? '12px' : '14px' }}>{line}</Typography>
                                ))}
                            </Box>

                            {/* Ship To */}
                            <Box sx={{
                                width: isMobile ? '100%' : '50%',
                                p: isMobile ? 1 : 2
                            }}>
                                <Typography sx={{ fontWeight: 'bold', fontSize: isMobile ? '13px' : '14px', mb: 1 }}>Ship To</Typography>
                                <Typography sx={{ fontSize: isMobile ? '12px' : '14px' }}>{contact_person_name}</Typography>
                                <Typography sx={{ fontSize: isMobile ? '12px' : '14px' }}>{contact_person_email}</Typography>
                                <Typography sx={{ fontSize: isMobile ? '12px' : '14px' }}>{address}</Typography>
                            </Box>
                        </Box>

                        {/* Items Table */}
                        <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
                            <Table size="small" sx={{ minWidth: isMobile ? '800px' : '100%' }}>
                                <TableHead>
                                    <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                                        <TableCell sx={{ ...headerCellStyle, borderTop: borderStyle, borderBottom: borderStyle, width: '40px' }}>#</TableCell>
                                        <TableCell sx={{ ...headerCellStyle, borderTop: borderStyle, borderBottom: borderStyle, width: '180px' }}>Item & Description</TableCell>
                                        <TableCell sx={{ ...headerCellStyle, borderTop: borderStyle, borderBottom: borderStyle, width: '100px' }}>HSN / SAC</TableCell>
                                        <TableCell sx={{ ...headerCellStyle, borderTop: borderStyle, borderBottom: borderStyle, width: '80px' }}>Qty</TableCell>
                                        <TableCell sx={{ ...headerCellStyle, borderTop: borderStyle, borderBottom: borderStyle, width: '80px' }}>Rate</TableCell>
                                        <TableCell colSpan={2} align="center" sx={{ ...headerCellStyle, borderTop: borderStyle, borderBottom: borderStyle }}>CGST</TableCell>
                                        <TableCell colSpan={2} align="center" sx={{ ...headerCellStyle, borderTop: borderStyle, borderBottom: borderStyle }}>SGST</TableCell>
                                        <TableCell sx={{ ...headerCellStyle, borderTop: borderStyle, borderBottom: borderStyle, textAlign: 'right', width: '100px' }}>Amount</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell sx={{ ...cellStyle, height: '0px', padding: 0 }}></TableCell>
                                        <TableCell sx={{ ...cellStyle, height: '0px', padding: 0 }}></TableCell>
                                        <TableCell sx={{ ...cellStyle, height: '0px', padding: 0 }}></TableCell>
                                        <TableCell sx={{ ...cellStyle, height: '0px', padding: 0 }}></TableCell>
                                        <TableCell sx={{ ...cellStyle, height: '0px', padding: 0 }}></TableCell>
                                        <TableCell sx={{ ...headerCellStyle, borderTop: borderStyle, borderBottom: borderStyle, width: '40px', textAlign: 'center' }}>%</TableCell>
                                        <TableCell sx={{ ...headerCellStyle, borderTop: borderStyle, borderBottom: borderStyle, width: '80px', textAlign: 'right' }}>Amt</TableCell>
                                        <TableCell sx={{ ...headerCellStyle, borderTop: borderStyle, borderBottom: borderStyle, width: '40px', textAlign: 'center' }}>%</TableCell>
                                        <TableCell sx={{ ...headerCellStyle, borderTop: borderStyle, borderBottom: borderStyle, width: '80px', textAlign: 'right' }}>Amt</TableCell>
                                        <TableCell sx={{ ...cellStyle, height: '0px', padding: 0 }}></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {orderItems.map((item, index) => {
                                        const quantity = Number(item.quantity);
                                        const rate = Number(item.unit_price);
                                        const cgstPercent = item.Product?.cgst ?? 0;
                                        const sgstPercent = item.Product?.sgst ?? 0;
                                        const amount = quantity * rate;
                                        const cgstAmount = (amount * cgstPercent) / 100;
                                        const sgstAmount = (amount * sgstPercent) / 100;

                                        return (
                                            <TableRow key={item.order_item_id}>
                                                <TableCell sx={cellStyle}>{index + 1}</TableCell>
                                                <TableCell sx={cellStyle}>
                                                    {item.Product?.product_name}
                                                    {item.notes ? ` - ${item.notes}` : ''}
                                                </TableCell>
                                                <TableCell sx={cellStyle}>--</TableCell>
                                                <TableCell sx={cellStyle}>
                                                    {item.quantity}
                                                </TableCell>
                                                <TableCell sx={cellStyle}>{rate.toFixed(2)}</TableCell>
                                                <TableCell sx={{ ...cellStyle, textAlign: 'center' }}>
                                                    {cgstPercent}%
                                                </TableCell>
                                                <TableCell sx={{ ...cellStyle, textAlign: 'right' }}>
                                                    {cgstAmount.toFixed(2)}
                                                </TableCell>
                                                <TableCell sx={{ ...cellStyle, textAlign: 'center' }}>
                                                    {sgstPercent}%
                                                </TableCell>
                                                <TableCell sx={{ ...cellStyle, textAlign: 'right' }}>
                                                    {sgstAmount.toFixed(2)}
                                                </TableCell>
                                                <TableCell sx={rightAlignedCell}>{amount.toFixed(2)}</TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </TableContainer>

                        {/* Footer Section */}
                        <Box sx={{
                            display: 'flex',
                            flexDirection: isMobile ? 'column' : 'row',
                            borderTop: borderStyle
                        }}>
                            {/* Left Column - Notes and Terms */}
                            <Box sx={{
                                width: isMobile ? '100%' : '50%',
                                p: isMobile ? 1 : 2,
                                borderRight: isMobile ? noBorderStyle : borderStyle,
                                borderBottom: isMobile ? borderStyle : noBorderStyle
                            }}>
                                <Typography sx={{ fontSize: isMobile ? '12px' : '14px', mb: 1 }}>
                                    Items in Total {subtotal.toFixed(2)}
                                </Typography>

                                <Typography sx={{ fontWeight: 'bold', fontSize: isMobile ? '12px' : '14px', mb: 0.5 }}>
                                    Total In Words
                                </Typography>
                                <Typography sx={{ fontStyle: 'italic', fontSize: isMobile ? '11px' : '14px', mb: 2 }}>
                                    {amountInWords(grandTotal)}
                                </Typography>

                                <Typography sx={{ fontWeight: 'bold', fontSize: isMobile ? '12px' : '14px', mb: 0.5 }}>
                                    Notes
                                </Typography>
                                <Typography sx={{ fontSize: isMobile ? '11px' : '14px', mb: 2 }}>
                                    Thank you for the Order. You just made our day.
                                </Typography>

                                <Typography sx={{ fontWeight: 'bold', fontSize: isMobile ? '12px' : '14px', mb: 0.5 }}>
                                    Terms & Conditions
                                </Typography>
                                <Typography sx={{ fontSize: isMobile ? '10px' : '12px' }}>
                                    All sales are final, and no refund will be issued. The Company does not offer any Return or Refund. Replacement Only available at the time of delivery incase of any poor quality or Wrong Products. Payment of the amount outstanding on the invoice is due fifteen calendar days from the date of the invoice.
                                </Typography>

                                {/* QR Code */}
                                <Box sx={{ mt: 4, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                    <Box
                                        component="img"
                                        src="/qr-code.png"
                                        alt="QR Code"
                                        sx={{ width: isMobile ? '80px' : '100px', height: isMobile ? '80px' : '100px', border: '1px solid #ccc' }}
                                    />
                                    <Typography sx={{ fontSize: isMobile ? '10px' : '12px', maxWidth: '180px', mt: 1 }}>
                                        Scan the QR code to view the configured information.
                                    </Typography>
                                </Box>
                            </Box>

                            {/* Right Column - Summary and Totals */}
                            <Box sx={{ width: isMobile ? '100%' : '50%' }}>
                                <Table size="small" sx={{ tableLayout: 'fixed' }}>
                                    <TableBody>
                                        <TableRow>
                                            <TableCell colSpan={2} sx={{ ...rightAlignedCell, pr: 2 }}>
                                                <Typography sx={{ fontWeight: 'bold', fontSize: isMobile ? '12px' : '14px' }}>
                                                    Sub Total
                                                </Typography>
                                                <Typography sx={{ fontSize: isMobile ? '9px' : '10px' }}>
                                                    (Tax Inclusive)
                                                </Typography>
                                            </TableCell>
                                            <TableCell sx={{ ...rightAlignedCell, width: '25%' }}>
                                                {subtotal.toFixed(2)}
                                            </TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell colSpan={2} sx={{ ...rightAlignedCell, pr: 2 }}>
                                                CGST
                                            </TableCell>
                                            <TableCell sx={rightAlignedCell}>
                                                {cgstAmount.toFixed(2)}
                                            </TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell colSpan={2} sx={{ ...rightAlignedCell, pr: 2 }}>
                                                SGST
                                            </TableCell>
                                            <TableCell sx={rightAlignedCell}>
                                                {sgstAmount.toFixed(2)}
                                            </TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell colSpan={2} sx={{ ...rightAlignedCell, pr: 2 }}>
                                                Delivery Fee
                                            </TableCell>
                                            <TableCell sx={rightAlignedCell}>
                                                {totalDeliveryFee.toFixed(2)}
                                            </TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell colSpan={2} sx={{ ...rightAlignedCell, pr: 2, fontWeight: 'bold' }}>
                                                Total
                                            </TableCell>
                                            <TableCell sx={{ ...rightAlignedCell, fontWeight: 'bold' }}>
                                                ₹{grandTotal.toFixed(2)}
                                            </TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell colSpan={2} sx={{ ...rightAlignedCell, pr: 2, fontWeight: 'bold' }}>
                                                Balance Due
                                            </TableCell>
                                            <TableCell sx={{ ...rightAlignedCell, fontWeight: 'bold' }}>
                                                ₹{grandTotal.toFixed(2)}
                                            </TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>

                                {/* Signature */}
                                <Box sx={{
                                    p: isMobile ? 1 : 2,
                                    mt: isMobile ? 4 : 8,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'flex-end'
                                }}>
                                    <Box sx={{
                                        borderTop: '1px solid #000',
                                        width: isMobile ? '150px' : '200px',
                                        textAlign: 'center',
                                        pt: 1
                                    }}>
                                        <Typography sx={{ fontSize: isMobile ? '12px' : '14px' }}>
                                            Authorized Signature
                                        </Typography>
                                    </Box>
                                </Box>
                            </Box>
                        </Box>
                    </Paper>
                </Box>
            </Container>

            <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0 }} elevation={3}>
                <Footer />
            </Paper>
        </Box>
    );
}

export default InvoicesPage;