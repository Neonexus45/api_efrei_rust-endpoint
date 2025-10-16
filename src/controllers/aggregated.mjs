import { exec } from 'child_process';
import { promisify } from 'util';
import AggregatedModel from '../models/aggregated.mjs';
import { enrichWithDarkData } from '../services/darkdata.service.mjs';

const execAsync = promisify(exec);

const Aggregated = class Aggregated {
  constructor(app, connect) {
    this.app = app;
    this.AggregatedModel = connect.model('Aggregated', AggregatedModel);

    this.run();
  }

  /**
   * POST /api/aggregated/ingest
   * Ingère les données du pipeline Rust et calcule les dark data
   */
  ingest() {
    this.app.post('/api/aggregated/ingest', async (req, res) => {
      try {
        // 1. Récupérer les données brutes
        const rawData = req.body;

        // 2. Enrichir avec les dark data
        const enrichedData = enrichWithDarkData(rawData);

        // 3. Créer le document MongoDB
        const aggregatedModel = new this.AggregatedModel(enrichedData);

        // 4. Sauvegarder dans la base
        const savedDoc = await aggregatedModel.save();

        // 5. Retourner l'objet complet avec son _id
        res.status(201).json(savedDoc);
      } catch (err) {
        console.error('[ERROR] /api/aggregated/ingest ->', err);

        res.status(500).json({
          code: 500,
          message: 'Internal Server error',
          error: err.message
        });
      }
    });
  }

  /**
   * GET /api/aggregated/:id
   * Récupère un document par son ID
   */
  showById() {
    this.app.get('/api/aggregated/:id', (req, res) => {
      try {
        this.AggregatedModel.findById(req.params.id).then((doc) => {
          res.status(200).json(doc || {});
        }).catch(() => {
          res.status(500).json({
            code: 500,
            message: 'Internal Server error'
          });
        });
      } catch (err) {
        console.error('[ERROR] /api/aggregated/:id ->', err);

        res.status(400).json({
          code: 400,
          message: 'Bad request'
        });
      }
    });
  }

  /**
   * GET /api/aggregated
   * Liste tous les documents
   */
  list() {
    this.app.get('/api/aggregated', (req, res) => {
      try {
        this.AggregatedModel.find({}).then((docs) => {
          res.status(200).json(docs || []);
        }).catch(() => {
          res.status(500).json({
            code: 500,
            message: 'Internal Server error'
          });
        });
      } catch (err) {
        console.error('[ERROR] /api/aggregated ->', err);

        res.status(400).json({
          code: 400,
          message: 'Bad request'
        });
      }
    });
  }

  /**
   * POST /api/aggregated/trigger-pipeline
   * Lance le pipeline Rust pour générer et ingérer des données
   */
  triggerPipeline() {
    this.app.post('/api/aggregated/trigger-pipeline', async (req, res) => {
      try {
        console.log('[INFO] Triggering Rust pipeline...');

        // Exécuter cargo run dans le dossier pipeline_aggregation_rust
        const { stdout, stderr } = await execAsync('cargo run', {
          cwd: './pipeline_aggregation_rust',
          timeout: 60000
        });

        console.log('[INFO] Rust pipeline output:', stdout);
        if (stderr) console.error('[WARN] Rust pipeline stderr:', stderr);

        res.status(200).json({
          success: true,
          message: 'Pipeline executed successfully',
          output: stdout,
          stderr: stderr || null
        });
      } catch (err) {
        console.error('[ERROR] /api/aggregated/trigger-pipeline ->', err);

        res.status(500).json({
          code: 500,
          message: 'Pipeline execution failed',
          error: err.message,
          stderr: err.stderr || null
        });
      }
    });
  }

  run() {
    this.ingest();
    this.showById();
    this.list();
    this.triggerPipeline();
  }
};

export default Aggregated;
