import express from 'express';
import { 
    createHoliday, 
    autoGenerateWeekends, 
    importGovernmentHolidays, 
    getAllHolidays, 
    updateHoliday, 
    deleteHoliday 
} from '../../controllers/superadmin/saHolidayController.js';

const router = express.Router();

router.post('/create', createHoliday);
router.post('/auto-weekends', autoGenerateWeekends);
router.post('/import-government', importGovernmentHolidays);
router.get('/', getAllHolidays);
router.put('/:id', updateHoliday);
router.delete('/:id', deleteHoliday);

export default router;