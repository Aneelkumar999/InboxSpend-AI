import os
import io
import base64
import pandas as pd
import matplotlib
matplotlib.use('Agg') # non-interactive backend
import matplotlib.pyplot as plt
from jinja2 import Environment, FileSystemLoader
from xhtml2pdf import pisa
from sqlalchemy.orm import Session
from app.services.report_service import ReportService
from app.services.analytics_service import FinancialAnalyticsEngine

class PDFService:
    def __init__(self, db: Session):
        self.db = db
        self.report_service = ReportService(db)
        self.analytics_engine = FinancialAnalyticsEngine()
        
        # Setup Jinja2 environment
        template_dir = os.path.join(os.path.dirname(__file__), '..', 'templates')
        os.makedirs(template_dir, exist_ok=True)
        self.env = Environment(loader=FileSystemLoader(template_dir))
        
        self._create_default_template(template_dir)

    def _create_default_template(self, template_dir: str):
        template_path = os.path.join(template_dir, 'report.html')
        if not os.path.exists(template_path):
            with open(template_path, 'w') as f:
                f.write("""
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Financial Report</title>
    <style>
        @page { size: A4; margin: 2cm; }
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; line-height: 1.6; }
        h1 { color: #2563eb; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; }
        h2 { color: #1e40af; margin-top: 30px; }
        .summary-box { background: #f3f4f6; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
        .grid { display: flex; flex-wrap: wrap; margin: -10px; }
        .col { flex: 1; padding: 10px; min-width: 200px; }
        .stat { font-size: 24px; font-weight: bold; color: #111827; }
        .label { font-size: 14px; color: #6b7280; text-transform: uppercase; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
        th { background: #f9fafb; font-weight: 600; color: #374151; }
        .chart-img { width: 100%; max-width: 600px; margin: 20px auto; display: block; }
        .insight { background: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 15px 0; }
    </style>
</head>
<body>
    <h1>Financial Report</h1>
    <p>Report Period: {{ period_label }}</p>
    
    <div class="summary-box">
        <div class="grid">
            <div class="col">
                <div class="label">Total Expense</div>
                <div class="stat">${{ "%.2f"|format(total_expense) }}</div>
            </div>
            <div class="col">
                <div class="label">Top Category</div>
                <div class="stat">{{ top_category }}</div>
            </div>
            <div class="col">
                <div class="label">Top Merchant</div>
                <div class="stat">{{ top_merchant }}</div>
            </div>
        </div>
    </div>

    <h2>AI Financial Insights</h2>
    {% for insight in insights %}
    <div class="insight">{{ insight }}</div>
    {% endfor %}

    <h2>Spending by Category</h2>
    {% if category_chart %}
    <img src="data:image/png;base64,{{ category_chart }}" class="chart-img" />
    {% endif %}

    <h2>Recent Transactions</h2>
    <table>
        <thead>
            <tr>
                <th>Date</th>
                <th>Merchant</th>
                <th>Category</th>
                <th>Amount</th>
            </tr>
        </thead>
        <tbody>
            {% for row in recent_transactions %}
            <tr>
                <td>{{ row.Date }}</td>
                <td>{{ row.Merchant }}</td>
                <td>{{ row.Category }}</td>
                <td>${{ "%.2f"|format(row.Amount) }}</td>
            </tr>
            {% endfor %}
        </tbody>
    </table>
</body>
</html>
                """)

    def _generate_category_chart(self, df: pd.DataFrame) -> str:
        if df.empty:
            return ""
        
        summary = df.groupby('Category')['Amount'].sum().sort_values(ascending=False)
        if summary.empty:
            return ""
            
        fig, ax = plt.subplots(figsize=(8, 5))
        summary.plot(kind='bar', ax=ax, color='#3b82f6')
        ax.set_title('Spending by Category', pad=20)
        ax.set_ylabel('Amount')
        ax.set_xlabel('')
        plt.xticks(rotation=45, ha='right')
        plt.tight_layout()
        
        buf = io.BytesIO()
        plt.savefig(buf, format='png', dpi=150)
        plt.close(fig)
        return base64.b64encode(buf.getvalue()).decode('utf-8')

    def generate_pdf(self, user_id: str, start_date=None, end_date=None, period_label="All Time") -> bytes:
        df = self.report_service.get_expenses_df(user_id, start_date, end_date)
        
        total_expense = df['Amount'].sum() if not df.empty else 0
        top_category = df.groupby('Category')['Amount'].sum().idxmax() if not df.empty and not df.groupby('Category')['Amount'].sum().empty else "N/A"
        top_merchant = df.groupby('Merchant')['Amount'].sum().idxmax() if not df.empty and not df.groupby('Merchant')['Amount'].sum().empty else "N/A"
        
        category_chart = self._generate_category_chart(df)
        recent_transactions = df.head(20).to_dict('records') if not df.empty else []
        
        # Get AI insights
        try:
            financial_insights = self.analytics_engine.generate_insights(self.db, user_id)
            insights = financial_insights.ai_insights
        except Exception:
            insights = ["No insights available at this time."]

        template = self.env.get_template('report.html')
        html_out = template.render(
            period_label=period_label,
            total_expense=total_expense,
            top_category=top_category,
            top_merchant=top_merchant,
            category_chart=category_chart,
            recent_transactions=recent_transactions,
            insights=insights
        )
        
        # xhtml2pdf converts HTML to PDF
        pdf_buf = io.BytesIO()
        pisa_status = pisa.CreatePDF(io.StringIO(html_out), dest=pdf_buf)
        return pdf_buf.getvalue()
